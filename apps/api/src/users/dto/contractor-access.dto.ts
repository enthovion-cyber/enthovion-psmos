import { IsString } from 'class-validator';

export class ContractorAccessDto {
  @IsString()
  contractorCompanyId!: string;
}
