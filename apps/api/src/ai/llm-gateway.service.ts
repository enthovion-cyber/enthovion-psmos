import { Injectable, Logger } from '@nestjs/common';

export type LlmResult = { text: string; model: string };

/**
 * Enterprise OpenAI LLM Gateway for Enthovion PSM OS.
 * Supports OpenAI (gpt-4o, gpt-4o-mini, gpt-4-turbo) and OpenAI-compatible gateways.
 */
@Injectable()
export class LlmGatewayService {
  private readonly logger = new Logger(LlmGatewayService.name);

  get isConfigured(): boolean {
    const provider = (process.env.AI_PROVIDER || 'openai').trim().toLowerCase();
    const hasKey = Boolean(process.env.AI_API_KEY || process.env.OPENAI_API_KEY);
    return (provider === 'openai' || provider === 'openai-compatible') && hasKey;
  }

  get enabled(): boolean {
    return this.isConfigured;
  }

  get modelName(): string {
    return process.env.AI_MODEL || process.env.OPENAI_MODEL || 'gpt-4o';
  }

  get apiKey(): string {
    return process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
  }

  get baseUrl(): string {
    return (process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  }

  /**
   * Generates completion with strict enterprise timeouts, zero temperature for deterministic outputs,
   * and clean error capture so callers fail over gracefully.
   */
  async complete(system: string, user: string, overrideModel?: string): Promise<LlmResult | null> {
    if (!this.enabled) {
      this.logger.debug('AI Gateway invoked while disabled or unconfigured; falling back to deterministic/extractive path.');
      return null;
    }

    const model = overrideModel || this.modelName;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          max_tokens: 1500
        }),
        signal: AbortSignal.timeout(15_000)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        this.logger.warn(`OpenAI Gateway HTTP ${response.status}: ${errorText.slice(0, 300)}`);
        return null;
      }

      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        model?: string;
      };

      const text = json.choices?.[0]?.message?.content?.trim();
      return text ? { text, model: json.model || model } : null;
    } catch (error) {
      this.logger.warn(`OpenAI Gateway call failed: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Generates vector embeddings using OpenAI text-embedding-3-small (1536 dims).
   */
  async embed(text: string): Promise<number[] | null> {
    if (!this.enabled) return null;
    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small',
          input: text.slice(0, 8000)
        }),
        signal: AbortSignal.timeout(6_000)
      });

      if (!response.ok) return null;
      const json = (await response.json()) as { data?: Array<{ embedding?: number[] }> };
      return json.data?.[0]?.embedding || null;
    } catch (error) {
      this.logger.warn(`Embedding generation failed: ${(error as Error).message}`);
      return null;
    }
  }
}
