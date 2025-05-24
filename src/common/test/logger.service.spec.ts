import { LoggerService } from '../logger/logger.service';
import * as winston from 'winston';

describe('LoggerService', () => {
  let service: LoggerService;
  let winstonLogger: winston.Logger; // A referência ao logger interno do winston

  beforeEach(() => {
    winstonLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as unknown as winston.Logger;

    jest.spyOn(winston, 'createLogger').mockReturnValue(winstonLogger);

    service = new LoggerService();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Limpa todos os mocks após cada teste
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  it('deve chamar winston.createLogger durante a inicialização', () => {
    expect(winston.createLogger).toHaveBeenCalledTimes(1);
  });

  describe('setContext', () => {
    it('deve definir o contexto do logger', () => {
      const context = 'MyServiceContext';
      service.setContext(context);
    });
  });

  describe('log', () => {
    it('deve chamar o método info do winstonLogger', () => {
      const message = 'Esta é uma mensagem de log';
      service.log(message);
      expect(winstonLogger.info).toHaveBeenCalledTimes(1);
      expect(winstonLogger.info).toHaveBeenCalledWith(message, {
        context: undefined,
      }); // Contexto inicial é undefined
    });

    it('deve chamar o método info do winstonLogger com o contexto definido', () => {
      const context = 'UserModule';
      const message = 'Usuário criado com sucesso';
      service.setContext(context); // Define o contexto via setContext
      service.log(message);
      expect(winstonLogger.info).toHaveBeenCalledWith(message, {
        context: context,
      });
    });

    it('deve chamar o método info do winstonLogger com o contexto sobrescrito', () => {
      const initialContext = 'InitialContext';
      const overrideContext = 'OverrideContext';
      const message = 'Mensagem com contexto sobrescrito';

      service.setContext(initialContext); // Define um contexto inicial
      service.log(message, overrideContext); // Sobrescreve o contexto diretamente na chamada do log

      expect(winstonLogger.info).toHaveBeenCalledWith(message, {
        context: overrideContext,
      });
      expect(winstonLogger.info).not.toHaveBeenCalledWith(message, {
        context: initialContext,
      });
    });
  });

  describe('error', () => {
    it('deve chamar o método error do winstonLogger', () => {
      const message = 'Ocorreu um erro';
      const trace = 'StackTraceExample';
      service.error(message, trace);
      expect(winstonLogger.error).toHaveBeenCalledTimes(1);
      expect(winstonLogger.error).toHaveBeenCalledWith(message, {
        context: undefined,
        trace,
      });
    });

    it('deve chamar o método error do winstonLogger com o contexto definido', () => {
      const context = 'AuthService';
      const message = 'Falha de autenticação';
      const trace = 'AuthErrorTrace';
      service.setContext(context);
      service.error(message, trace);
      expect(winstonLogger.error).toHaveBeenCalledWith(message, {
        context: context,
        trace,
      });
    });

    it('deve chamar o método error do winstonLogger com o contexto sobrescrito', () => {
      const initialContext = 'DBService';
      const overrideContext = 'MigrationError';
      const message = 'Erro na migração do banco de dados';
      const trace = 'MigrationStackTrace';

      service.setContext(initialContext);
      service.error(message, trace, overrideContext);

      expect(winstonLogger.error).toHaveBeenCalledWith(message, {
        context: overrideContext,
        trace,
      });
      expect(winstonLogger.error).not.toHaveBeenCalledWith(message, {
        context: initialContext,
        trace,
      });
    });
  });

  describe('warn', () => {
    it('deve chamar o método warn do winstonLogger', () => {
      const message = 'Este é um aviso';
      service.warn(message);
      expect(winstonLogger.warn).toHaveBeenCalledTimes(1);
      expect(winstonLogger.warn).toHaveBeenCalledWith(message, {
        context: undefined,
      });
    });

    it('deve chamar o método warn do winstonLogger com o contexto definido', () => {
      const context = 'PaymentGateway';
      const message = 'Tentativa de pagamento falha';
      service.setContext(context);
      service.warn(message);
      expect(winstonLogger.warn).toHaveBeenCalledWith(message, {
        context: context,
      });
    });

    it('deve chamar o método warn do winstonLogger com o contexto sobrescrito', () => {
      const initialContext = 'CacheService';
      const overrideContext = 'CacheMiss';
      const message = 'Chave não encontrada no cache';

      service.setContext(initialContext);
      service.warn(message, overrideContext);

      expect(winstonLogger.warn).toHaveBeenCalledWith(message, {
        context: overrideContext,
      });
      expect(winstonLogger.warn).not.toHaveBeenCalledWith(message, {
        context: initialContext,
      });
    });
  });
});
