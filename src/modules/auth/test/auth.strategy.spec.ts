import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtStrategy } from '../strategy/jwt.strategy';
import { Client } from '../../clients/entities/client.entity';
import { Role } from '../../../common/enums/Role.enum';
import { Document } from '../../../common/enums/Document.enum';
import { Plan } from '../../../common/enums/Plan.enum';
import { LoggerService } from '../../../common/logger/logger.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let clientRepository: Repository<Client>;

  // Mock do cliente para usar nos testes
  const mockClient: Client = {
    id: 'testClientId123',
    name: 'Test Client',
    documentId: '12345678900',
    documentType: Document.CPF,
    planType: Plan.PREPAID,
    balance: 100,
    limit: 0,
    role: Role.USER,
    createDateTime: new Date(),
    lastChangedDateTime: new Date(),
    active: true,
    debit: jest.fn(),
  };

  const mockInactiveClient: Client = {
    ...mockClient,
    id: 'inactiveClientId',
    active: false,
    debit: jest.fn(),
  };

  // Mock do repositório de clientes
  const mockClientRepository = {
    findOne: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    warn: jest.fn(),
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    process.env.JWT_SECRET =
      '949c20de63f46673c5580a434813fe4feb298b5821f4cb0ca8757ca35f487f829d07db75d81211afc71163edce1df26fc8831b2d16689b1620de58993fad4e028a54acc7b5fdfc7a72133b60483f92311eef3cc08652a6c73d7f52235d25055e69e48e93447399a78f60ecb000434fa56eeb66b3518e465e3eee06ba88fd656d94a570a492d9d68c48e67b5e903e8653e74735e9bc81c3783696ec01a1852862a4dfc09728eed2d34913a17a9a129c4183c7c7294f8a5d9124518dbd211f66b28f0f0751f984f58f43755f1950cbbd54f1c4fb55994adc9f2021b9c82096f8ab4bc74678c7f6520152d3f8fe6d94cf89c0d9adff32d126d812dd23ac9af1503c'; // Use uma chave secreta consistente

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: getRepositoryToken(Client),
          useValue: mockClientRepository,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    clientRepository = module.get<Repository<Client>>(
      getRepositoryToken(Client),
    );

    // Limpar mocks antes de cada teste
    mockClientRepository.findOne.mockClear();
  });

  it('Deve estar definida a estratégia de geração JWT', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('Deve retornar um cliente se a validação for um sucesso e o cliente está ativo', async () => {
      mockClientRepository.findOne.mockResolvedValue(mockClient);

      const payload = {
        id: mockClient.id,
        name: mockClient.name,
        role: mockClient.role,
      };
      const result = await strategy.validate(payload);

      expect(clientRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.id },
      });
      expect(result).toEqual(mockClient);
    });

    it('Deve lançar UnauthorizedException caso não encontre o cliente', async () => {
      mockClientRepository.findOne.mockResolvedValue(null);

      const payload = {
        id: 'nonExistentId',
        name: 'Non Existent',
        role: Role.USER,
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(clientRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.id },
      });
    });

    it('Deve lançar UnauthorizedException se o cliente for inativo', async () => {
      mockClientRepository.findOne.mockResolvedValue(mockInactiveClient);

      const payload = {
        id: mockInactiveClient.id,
        name: mockInactiveClient.name,
        role: mockInactiveClient.role,
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(clientRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.id },
      });
    });
  });
});
