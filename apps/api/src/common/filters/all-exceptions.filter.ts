import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const internalMessage = exception instanceof Error ? exception.message : 'Internal server error';
    const isProduction = process.env.NODE_ENV === 'production';
    const body = exception instanceof HttpException ? exception.getResponse() : isProduction ? 'Internal server error' : internalMessage;
    if (!(exception instanceof HttpException)) {
      console.error(exception);
    }

    const message = typeof body === 'string' ? body : (body as { message?: unknown }).message;
    response.status(status).json({
      error: {
        statusCode: status,
        message,
        details: typeof body === 'object' ? body : undefined,
        timestamp: new Date().toISOString()
      }
    });
  }
}
