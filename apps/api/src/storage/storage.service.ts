import { Injectable, NotFoundException } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

@Injectable()
export class StorageService {
  buildObjectKey(tenantId: string, bucket: string, fileName: string): string {
    return `${tenantId}/${bucket}/${crypto.randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  }

  async putObject(storageKey: string, contents: Buffer): Promise<void> {
    const target = path.join(process.cwd(), '.uploads', storageKey);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents);
  }

  async getObject(storageKey: string): Promise<Buffer> {
    try {
      return await readFile(path.join(process.cwd(), '.uploads', storageKey));
    } catch {
      throw new NotFoundException('Stored attachment content was not found.');
    }
  }
}
