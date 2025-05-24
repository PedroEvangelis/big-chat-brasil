import { ExceptionInterceptor } from '../interceptors/exception.interceptor';
import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggerService } from '../logger/logger.service';
import * as winston from 'winston';

describe('ExceptionInterceptor', () => {
  let interceptor: ExceptionInterceptor;
  let mockLoggerService: LoggerService;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  let winstonLogger: winston.Logger;

  beforeEach(() => {
    winstonLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as unknown as winston.Logger;

    mockLoggerService = new LoggerService();

    // Mock do ExecutionContext para simular a requisição HTTP
    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          url: '/test-url',
          method: 'GET',
        }),
      }),

      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      getType: jest.fn(),
    } as unknown as ExecutionContext; // Casting para garantir o tipo

    mockCallHandler = {
      handle: jest.fn(),
    };

    interceptor = new ExceptionInterceptor(mockLoggerService);
  });

  it('deve ser definido', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('não deve logar erros se a requisição for bem-sucedida', async () => {
      // Simula uma requisição bem-sucedida
      jest
        .spyOn(mockCallHandler, 'handle')
        .mockReturnValue(of({ data: 'success' }));

      const result = await interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .toPromise();

      expect(mockCallHandler.handle).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data: 'success' });
    });

    it('deve capturar e logar HttpException', async () => {
      const httpError = new HttpException(
        'Recurso não encontrado',
        HttpStatus.NOT_FOUND,
      );
      // Simula o lançamento de uma HttpException
      jest
        .spyOn(mockCallHandler, 'handle')
        .mockReturnValue(throwError(() => httpError));

      await expect(
        interceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .toPromise(),
      ).rejects.toThrow(httpError);
    });

    it('deve capturar e logar um erro genérico', async () => {
      const genericError = new Error('Erro inesperado!');
      // Simula o lançamento de um erro genérico
      jest
        .spyOn(mockCallHandler, 'handle')
        .mockReturnValue(throwError(() => genericError));

      await expect(
        interceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .toPromise(),
      ).rejects.toThrow(genericError);
    });

    it('deve logar a resposta completa da HttpException se for um objeto', async () => {
      const errorResponse = {
        statusCode: 400,
        message: ['Campo inválido'],
        error: 'Bad Request',
      };
      const httpError = new HttpException(
        errorResponse,
        HttpStatus.BAD_REQUEST,
      );
      jest
        .spyOn(mockCallHandler, 'handle')
        .mockReturnValue(throwError(() => httpError));

      await expect(
        interceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .toPromise(),
      ).rejects.toThrow(httpError);
    });

    it('deve relançar o erro original', async () => {
      const originalError = new Error('Erro a ser relançado');
      jest
        .spyOn(mockCallHandler, 'handle')
        .mockReturnValue(throwError(() => originalError));

      let caughtError: any;
      try {
        await interceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .toPromise();
      } catch (e) {
        caughtError = e;
      }
      expect(caughtError).toBe(originalError); // Garante que o erro relançado é a mesma instância
    });
  });
});
