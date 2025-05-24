import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../../../common/enums/Document.enum';
import { Plan } from '../../../common/enums/Plan.enum';
import { Role } from '../../../common/enums/Role.enum';
import { Client } from '../entities/client.entity';
import { CreateClientDto } from '../dto/create-client.dto';
import { ClientsService } from '../clients.service';

describe('ClientsService', () => {
  let service: ClientsService;
  let clientRepository: Repository<Client>;

  // Mock de dados para uso nos testes
  const mockClient: Client = {
    id: 'random',
    name: 'Teste Cliente',
    documentId: '12345678900',
    documentType: Document.CPF,
    planType: Plan.PREPAID,
    active: true,
    balance: 0,
    limit: 0,
    role: Role.USER,
    createDateTime: new Date(),
    lastChangedDateTime: new Date(),
    debit: jest.fn(),
  };

  const mockCreateClientDto: CreateClientDto = {
    name: 'Novo Cliente',
    documentId: '09876543211',
    documentType: Document.CPF,
    planType: Plan.POSTPAID,
  };

  const mockUpdateClientDto: Partial<CreateClientDto> = {
    name: 'Cliente Atualizado',
    planType: Plan.POSTPAID,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: getRepositoryToken(Client),
          useClass: Repository, // Usaremos um mock para os métodos do repositório
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    clientRepository = module.get<Repository<Client>>(
      getRepositoryToken(Client),
    );

    // Espionar e mockar métodos do repositório
    jest.spyOn(clientRepository, 'findOne').mockResolvedValue(null);
    jest
      .spyOn(clientRepository, 'create')
      .mockReturnValue(mockClient as Client);
    jest
      .spyOn(clientRepository, 'save')
      .mockResolvedValue(mockClient as Client);
    jest.spyOn(clientRepository, 'find').mockResolvedValue([mockClient]);
    jest.spyOn(clientRepository, 'update').mockResolvedValue(null!); // O update retorna um UpdateResult, mas para o mock basta um valor resolvido
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Deve existir o serviço', () => {
    expect(service).toBeDefined();
  });

  // --- Testes para o método `create` ---
  describe('create', () => {
    it('Deve criar um novo cliente com sucesso', async () => {
      // Garante que findOne retorne null, indicando que o cliente não existe
      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(null);
      const result = await service.create(mockCreateClientDto);
      expect(result).toEqual(mockClient);
      expect(clientRepository.findOne).toHaveBeenCalledWith({
        where: { documentId: mockCreateClientDto.documentId },
      });
      expect(clientRepository.create).toHaveBeenCalledWith(mockCreateClientDto);
      expect(clientRepository.save).toHaveBeenCalledWith(mockClient);
    });

    it('Deve lançar ConflictException se já existir um cliente com o documento cadastrando', async () => {
      // Faz com que findOne retorne um cliente existente
      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient);

      await expect(service.create(mockCreateClientDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(mockCreateClientDto)).rejects.toThrow(
        'Já existe um usuário com esse documento',
      );
      expect(clientRepository.findOne).toHaveBeenCalledWith({
        where: { documentId: mockCreateClientDto.documentId },
      });
      expect(clientRepository.create).not.toHaveBeenCalled();
      expect(clientRepository.save).not.toHaveBeenCalled();
    });
  });

  // --- Testes para o método `findAll` ---
  describe('findAll', () => {
    it('Deve retornar os clientes se houver', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockClient]);
      expect(clientRepository.find).toHaveBeenCalled();
    });

    it('Deve retornar um array vazio caso não haja cliente', async () => {
      jest.spyOn(clientRepository, 'find').mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  // --- Testes para o método `findOne` ---
  describe('findOne', () => {
    it('Deve retornar um cliente se encontrar', async () => {
      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient);
      const result = await service.findOne(mockClient.id);
      expect(result).toEqual(mockClient);
      expect(clientRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockClient.id },
      });
    });

    it('Deve lançar NotFoundException se não achar o cliente', async () => {
      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(null);
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        `Não existe cliente com id non-existent-id`,
      );
      expect(clientRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
    });
  });

  // --- Testes para o método `update` ---
  describe('update', () => {
    it('Deve fazer update de um cliente com sucesso', async () => {
      // Mock para findOne do update retornar o cliente original
      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient);

      // Mock para o segundo findOne (chamado dentro de findOne no update) retornar o cliente atualizado
      const updatedClient = { ...mockClient, ...mockUpdateClientDto };
      jest.spyOn(service, 'findOne').mockResolvedValue(updatedClient as Client); // Mockando o findOne do service

      const result = await service.update(mockClient.id, mockUpdateClientDto);
      expect(clientRepository.update).toHaveBeenCalledWith(
        mockClient.id,
        mockUpdateClientDto,
      );
      expect(service.findOne).toHaveBeenCalledWith(mockClient.id); // Verifica se findOne foi chamado para retornar o cliente atualizado
      expect(result).toEqual(updatedClient);
    });

    it('Deve lançar NotFoundException se o cliente não for encontrado pelo findOne', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(
          new NotFoundException(`Não existe cliente com id some-id`),
        );

      await expect(
        service.update('some-id', mockUpdateClientDto),
      ).rejects.toThrow(NotFoundException);
      expect(clientRepository.update).toHaveBeenCalledWith(
        'some-id',
        mockUpdateClientDto,
      ); // O update é chamado antes da verificação
      expect(service.findOne).toHaveBeenCalledWith('some-id');
    });
  });
});
