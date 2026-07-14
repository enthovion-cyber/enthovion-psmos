import { Injectable } from '@nestjs/common';

@Injectable()
export class PdfService {
  createRenderJob(template: string, data: Record<string, unknown>) {
    return { template, data, requestedAt: new Date().toISOString() };
  }
}
