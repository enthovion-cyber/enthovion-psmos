export type ApiEnvelope<T> = {
  data: T;
  meta: {
    timestamp: string;
    requestId?: string;
  };
};
