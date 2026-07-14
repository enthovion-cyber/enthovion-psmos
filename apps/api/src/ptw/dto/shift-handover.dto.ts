import { IsBoolean, IsDateString, IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export const handoverProgressStatuses = ['Not Started', 'In Progress', 'Partially Complete', 'Complete', 'Stopped', 'Suspended'] as const;

export class ShiftHandoverDto {
  @IsString()
  currentShiftName!: string;

  @IsDateString()
  currentShiftStart!: string;

  @IsDateString()
  currentShiftEnd!: string;

  @IsString()
  incomingShiftName!: string;

  @IsDateString()
  incomingShiftStart!: string;

  @IsOptional()
  @IsDateString()
  incomingShiftEnd?: string;

  @IsOptional()
  @IsString()
  outgoingSupervisorId?: string;

  @IsString()
  outgoingSupervisorName!: string;

  @IsOptional()
  @IsString()
  incomingSupervisorId?: string;

  @IsString()
  incomingSupervisorName!: string;

  @IsOptional()
  @IsString()
  incomingSupervisorContact?: string;

  @IsIn(handoverProgressStatuses)
  workProgressStatus!: string;

  @IsOptional()
  @IsString()
  workProgressNotes?: string;

  @IsOptional()
  @IsString()
  remainingWork?: string;

  @IsOptional()
  @IsString()
  hazardsObserved?: string;

  @IsOptional()
  @IsString()
  specialPrecautions?: string;

  @IsOptional()
  @IsString()
  controlRoomMessage?: string;

  @IsOptional()
  @IsString()
  incomingSupervisorComments?: string;

  @IsOptional()
  @IsObject()
  checklist?: Record<string, boolean>;
}

export class HandoverChecklistDto {
  @IsBoolean()
  isChecked!: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class HandoverAcknowledgeDto {
  @IsString()
  signature!: string;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;
}

export class SuspendHandoverDto {
  @IsString()
  reason!: string;
}
