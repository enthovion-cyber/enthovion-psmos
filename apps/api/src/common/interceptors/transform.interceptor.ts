import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

type Envelope<T> = {
  data: T;
  meta: {
    timestamp: string;
    requestId?: string | undefined;
  };
};

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Envelope<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Envelope<T>> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    return next.handle().pipe(
      map((data) => ({
        data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.headers['x-request-id']
        }
      }))
    );
  }
}
