import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class EquipmentTagValidator {
  assertValid(tag: string) {
    if (!/^[A-Z0-9][A-Z0-9._-]{1,47}$/.test(tag)) {
      throw new BadRequestException('Equipment tag must be uppercase alphanumeric with optional dot, dash, or underscore.');
    }
  }
}
