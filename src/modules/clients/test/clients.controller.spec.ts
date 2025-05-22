import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';
import { Repository } from 'typeorm';
import { ClientsController } from '../clients.controller';
import { ClientsService } from '../clients.service';
import { CreateClientDto } from '../dto/create-client.dto';
import { Client } from '../entities/client.entity';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Role } from '../../../common/enums/Role.enum';
import { Document } from '../../../common/enums/Document.enum';
import { Plan } from '../../../common/enums/Plan.enum';

// Mock para o AuthGuard
const mockAuthGuard = {
  canActivate: jest.fn(() => true),
};

// Mock para o RolesGuard
const mockRolesGuard = {
  canActivate: jest.fn(() => true),
};

describe('ClientsController', () => {
  let controller: ClientsController;
  let service: ClientsService;
  let clientsRepository: Repository<Client>;

  // Mock de um cliente para usar nos testes
  const mockClient: Client = {
    id: 'someClientId',
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
  };

  // Mock de um administrador para usar nos testes
  const mockAdminClient: Client = {
    ...mockClient,
    id: 'adminClientId',
    role: Role.ADMIN,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        {
          provide: ClientsService,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: AuthGuard('jwt'),
          useValue: mockAuthGuard,
        },
        {
          provide: RolesGuard,
          useValue: mockRolesGuard,
        },
        {
          provide: getRepositoryToken(Client),
          useClass: Repository,
        },
      ],
    })
      .overrideProvider(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .overrideProvider(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<ClientsController>(ClientsController);
    service = module.get<ClientsService>(ClientsService);
    clientsRepository = module.get<Repository<Client>>(
      getRepositoryToken(Client),
    );

    // Resetar os mocks antes de cada teste
    mockAuthGuard.canActivate.mockClear();
    mockRolesGuard.canActivate.mockClear();
  });

  it('Deve estar definido o controller', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('Deve retornar um array de clientes (ADMIN role required)', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue([mockClient]);

      // Simula que o AuthGuard e o RolesGuard permitem o acesso
      mockAuthGuard.canActivate.mockReturnValue(true);
      mockRolesGuard.canActivate.mockReturnValue(true);

      const result = await controller.findAll();
      expect(result).toEqual([mockClient]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('Deve criar um novo cliente', async () => {
      const createClientDto: CreateClientDto = {
        name: 'New Client',
        documentId: '98765432100',
        documentType: Document.CPF,
        planType: Plan.POSTPAID,
        active: true,
      };
      jest.spyOn(service, 'create').mockResolvedValue({
        ...mockClient,
        ...createClientDto,
        id: 'newClientId',
      });

      const result = await controller.create(createClientDto);
      expect(result).toEqual(expect.objectContaining({ name: 'New Client' }));
      expect(service.create).toHaveBeenCalledWith(createClientDto);
    });
  });

  describe('findOne', () => {
    it('Deve retornar um único cliente', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockClient);

      const result = await controller.findOne(mockClient.id);
      expect(result).toEqual(mockClient);
      expect(service.findOne).toHaveBeenCalledWith(mockClient.id);
    });
  });

  describe('update', () => {
    it('Deve fazer update no usuário caso ele seja o mesmo autenticado', async () => {
      const updateClientDto: Partial<CreateClientDto> = {
        name: 'Updated Client Name',
      };
      jest.spyOn(service, 'update').mockResolvedValue({
        ...mockClient,
        ...updateClientDto,
      });

      const result = await controller.update(
        mockClient, // Este é o valor que o @GetUser passaria
        mockClient.id,
        updateClientDto,
      );

      expect(result).toEqual(
        expect.objectContaining({ name: 'Updated Client Name' }),
      );
      expect(service.update).toHaveBeenCalledWith(
        mockClient.id,
        updateClientDto,
      );
    });

    it('Deve lançar UnauthorizedException se o cliente autenticado não for o que está atualizando', async () => {
      const anotherClient: Client = { ...mockClient, id: 'anotherClientId' };
      const updateClientDto: Partial<CreateClientDto> = {
        name: 'Updated Client Name',
      };

      await expect(
        controller.update(
          anotherClient, // Este é o usuário que o @GetUser retornaria
          mockClient.id, // Mas estamos tentando atualizar mockClient.id
          updateClientDto,
        ),
      ).rejects.toThrow(UnauthorizedException);
      expect(service.update).not.toHaveBeenCalled(); // Garante que o serviço não foi chamado
    });
  });

  describe('getBalance', () => {
    it('Deve retornar o Balance do cliente autenticado', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockClient);

      const result = await controller.getBalance(mockClient.id, mockClient);

      expect(result).toEqual({
        balance: mockClient.balance,
        limit: mockClient.limit,
      });
      expect(service.findOne).toHaveBeenCalledWith(mockClient.id);
    });

    it('Deve lançar UnauthorizedException se o usuário autenticado não for o que está na sessão', async () => {
      const anotherClient: Client = { ...mockClient, id: 'anotherClientId' };

      await expect(
        controller.getBalance(mockClient.id, anotherClient),
      ).rejects.toThrow(UnauthorizedException);
      expect(service.findOne).not.toHaveBeenCalled(); // Garante que o serviço não foi chamado
    });
  });
});
