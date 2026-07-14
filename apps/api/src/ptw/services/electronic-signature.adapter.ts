import { BadRequestException } from '@nestjs/common';

export class ElectronicSignatureAdapter {
  static assertValid(input: { confirmed?: boolean; electronicSignature?: string | null }) {
    if (!input.confirmed) throw new BadRequestException('Signature confirmation checkbox is required');
    if (!input.electronicSignature?.trim()) throw new BadRequestException('Electronic signature confirmation is required');
  }
}
