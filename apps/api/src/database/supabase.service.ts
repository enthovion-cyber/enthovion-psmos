import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { request as httpsRequest, RequestOptions } from 'node:https';

@Injectable()
export class SupabaseService implements OnModuleInit {
  client!: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('supabase.url') ?? process.env.SUPABASE_URL;
    const serviceRoleKey = this.config.get<string>('supabase.serviceRoleKey') ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }
    this.logger.log(`Supabase client configured for ${new URL(url).host}`);
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: this.fetchWithRetry.bind(this) }
    });
  }

  from(table: string) {
    return this.client.from(table);
  }

  async single<T>(query: PromiseLike<any>, message = 'Record not found') {
    try {
      const { data, error } = await query;
      if (error) throw new Error(error.message || message);
      if (!data) return null;
      return data as T;
    } catch (error) {
      this.throwTransportError(error);
    }
  }

  async many<T>(query: PromiseLike<any>) {
    try {
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []) as T[];
    } catch (error) {
      this.throwTransportError(error);
    }
  }

  private async fetchWithRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let lastError: unknown;
    const host = this.requestHost(input);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await fetch(input, init);
      } catch (error) {
        lastError = error;
        if (this.transportReason(error) === 'UND_ERR_HEADERS_OVERFLOW') {
          this.logger.warn(`Supabase response headers exceeded Undici's limit; retrying ${host} through the large-header HTTPS transport.`);
          return this.fetchWithLargeHeaders(input, init);
        }
        this.logger.warn(`Supabase request to ${host} failed on attempt ${attempt + 1}/3: ${this.transportReason(error)}`);
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
      }
    }
    throw new Error(`Supabase transport failure: ${this.transportReason(lastError)}`);
  }

  private async fetchWithLargeHeaders(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = this.requestUrl(input);
    const inputRequest = typeof Request !== 'undefined' && input instanceof Request ? input : null;
    const headers = new Headers(inputRequest?.headers);
    new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
    const method = init?.method ?? inputRequest?.method ?? 'GET';
    const body = await this.nodeRequestBody(init?.body, inputRequest);
    const requestHeaders: Record<string, string> = {};
    headers.forEach((value, key) => { requestHeaders[key] = value; });
    const options: RequestOptions = {
      method,
      headers: requestHeaders,
      maxHeaderSize: 128 * 1024
    };
    const signal = init?.signal ?? inputRequest?.signal;
    if (signal) options.signal = signal;

    return new Promise<Response>((resolve, reject) => {
      const request = httpsRequest(url, options, (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer | string) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        response.on('error', reject);
        response.on('end', () => {
          const responseHeaders = new Headers();
          for (const [name, value] of Object.entries(response.headers)) {
            if (Array.isArray(value)) value.forEach((item) => responseHeaders.append(name, item));
            else if (value !== undefined) responseHeaders.set(name, String(value));
          }
          const status = response.statusCode ?? 500;
          const hasNoBody = method.toUpperCase() === 'HEAD' || [204, 205, 304].includes(status);
          resolve(new Response(hasNoBody ? null : Buffer.concat(chunks), {
            status,
            ...(response.statusMessage ? { statusText: response.statusMessage } : {}),
            headers: responseHeaders
          }));
        });
      });
      request.on('error', reject);
      if (body) request.write(body);
      request.end();
    });
  }

  private async nodeRequestBody(body: BodyInit | null | undefined, inputRequest: Request | null): Promise<Buffer | string | undefined> {
    if (body === undefined || body === null) {
      if (!inputRequest?.body) return undefined;
      return Buffer.from(await inputRequest.clone().arrayBuffer());
    }
    if (typeof body === 'string') return body;
    if (body instanceof URLSearchParams) return body.toString();
    if (body instanceof ArrayBuffer) return Buffer.from(body);
    if (ArrayBuffer.isView(body)) return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
    if (typeof Blob !== 'undefined' && body instanceof Blob) return Buffer.from(await body.arrayBuffer());
    return Buffer.from(await new Response(body).arrayBuffer());
  }

  private throwTransportError(error: unknown): never {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes('fetch failed') || message.toLowerCase().includes('network') || message.toLowerCase().includes('supabase transport failure')) {
      throw new ServiceUnavailableException(`Supabase data API is unavailable (${this.transportReason(error)}). Check the running API environment, proxy, and network connection.`);
    }
    throw error;
  }

  private transportReason(error: unknown) {
    const candidate = error as { cause?: { code?: string; message?: string }; code?: string; message?: string } | undefined;
    return candidate?.cause?.code ?? candidate?.code ?? candidate?.cause?.message ?? candidate?.message ?? 'Unknown transport error';
  }

  private requestHost(input: RequestInfo | URL) {
    try {
      return this.requestUrl(input).host;
    } catch {
      return 'configured Supabase endpoint';
    }
  }

  private requestUrl(input: RequestInfo | URL) {
    if (input instanceof URL) return input;
    if (typeof input === 'string') return new URL(input);
    return new URL(input.url);
  }
}
