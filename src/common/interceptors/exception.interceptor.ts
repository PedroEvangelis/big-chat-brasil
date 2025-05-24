// src/common/interceptors/exception.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class ExceptionInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext(ExceptionInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    return next.handle().pipe(
      catchError((err) => {
        const status =
          err instanceof HttpException
            ? err.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
          err instanceof HttpException
            ? err.getResponse()
            : 'Internal server error';

        const errorLog = {
          timestamp: new Date().toISOString(),
          path: req.url,
          method: req.method,
          statusCode: status,
          errorMessage:
            typeof message === 'object' ? JSON.stringify(message) : message,
          stack: err.stack,
          // Adicionar informações do usuário se disponível
          // userId: req.user?.id,
        };
        this.logger.error(
          `Exception occurred: ${errorLog.errorMessage}`,
          errorLog.stack,
          JSON.stringify(errorLog),
        );

        // Re-lançar o erro para que o NestJS lide com a resposta HTTP
        return throwError(() => err);
      }),
    );
  }
}
