import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Client } from '../../clients/entities/client.entity';
import { Plan } from '../../../common/enums/Plan.enum';
import { Document } from '../../../common/enums/Document.enum';
import { Role } from '../../../common/enums/Role.enum';

describe('AuthService', () => {
  let authService: AuthService;
  let clientRepository: Repository<Client>;
  let jwtService: JwtService;

  // Crie um mockClient "base" para não ter que redefinir em cada teste
  const baseMockClient = {
    id: 'client123',
    name: 'Compania ABC',
    documentId: '12345678000199',
    documentType: Document.CNPJ,
    planType: Plan.PREPAID,
    balance: 100.0,
    limit: null,
    active: true,
  };

  const mockClientRepository = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(() => 'fake-jwt-token'), // Mocke sign para sempre retornar um token
  };

  beforeEach(async () => {
    jest.clearAllMocks(); // Limpa chamadas dos mocks
    // para que modificações em um teste não afetem os outros.
    mockClientRepository.findOne.mockResolvedValue({ ...baseMockClient });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Client),
          useValue: mockClientRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    clientRepository = module.get<Repository<Client>>(
      getRepositoryToken(Client),
    );
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('login', () => {
    it('Deve retornar o JWT e os dados do cliente do plano PREPAID', async () => {
      const payload = {
        documentId: '12345678000199',
        documentType: Document.CNPJ,
        role: Role.USER,
      };
      const result = await authService.login(payload);

      expect(mockClientRepository.findOne).toHaveBeenCalledWith({
        where: { documentId: payload.documentId }, // Verifique o argumento passado ao findOne
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        id: baseMockClient.id,
        name: baseMockClient.name,
      });

      const { limit, ...userWithoutLimit } = baseMockClient; // Remove limit, que não deve ser retornado

      expect(result).toEqual({
        token: 'fake-jwt-token',
        client: { ...userWithoutLimit },
      });

      expect(result).not.toContain('limit');
    });

    it('Deve retornar o JWT e os dados do cliente do plano POSTPAID', async () => {
      // Mock para simular um cliente POSTPAID
      const postpaidClient = {
        ...baseMockClient,
        planType: Plan.POSTPAID,
        limit: 500.0,
        balance: null,
      };
      mockClientRepository.findOne.mockResolvedValue(postpaidClient);

      const payload = {
        documentId: '12345678000199',
        documentType: Document.CNPJ,
      };
      const result = await authService.login(payload);

      expect(mockClientRepository.findOne).toHaveBeenCalledWith({
        where: { documentId: payload.documentId },
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        id: postpaidClient.id,
        name: postpaidClient.name,
      });

      // Verifique a estrutura completa do retorno para POSTPAID
      const { balance, ...userWithoutBalance } = postpaidClient; // Remove balance, que não deve ser retornado
      expect(result).toEqual({
        token: 'fake-jwt-token',
        client: { ...userWithoutBalance, limit: postpaidClient.limit },
      });
    });

    it('Deve lançar uma exceção de cliente inativo', async () => {
      const inactiveClient = { ...baseMockClient, active: false };
      mockClientRepository.findOne.mockResolvedValue(inactiveClient);

      await expect(
        authService.login({
          documentId: '12345678000199',
          documentType: Document.CNPJ,
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockClientRepository.findOne).toHaveBeenCalledWith({
        where: { documentId: '12345678000199' },
      });
    });

    it('Deve lançar uma exceção de não encontrado', async () => {
      mockClientRepository.findOne.mockResolvedValue(null);

      await expect(
        authService.login({
          documentId: 'wrong_id',
          documentType: Document.CNPJ,
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockClientRepository.findOne).toHaveBeenCalledWith({
        where: { documentId: 'wrong_id' },
      });
    });
  });
});
