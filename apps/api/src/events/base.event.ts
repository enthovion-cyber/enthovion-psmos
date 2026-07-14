export type BaseEvent<TPayload extends Record<string, unknown>> = {
  type: string;
  tenantId: string;
  actorId?: string;
  occurredAt: string;
  payload: TPayload;
};
