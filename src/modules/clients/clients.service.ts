import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const existingClient = await this.clientRepository.findOne({
      where: { documentId: createClientDto.documentId },
    });

    if (existingClient) {
      throw new ConflictException('Já existe um usuário com esse documento');
    }

    const newUser = this.clientRepository.create(createClientDto);
    return await this.clientRepository.save(newUser);
  }

  async findAll(): Promise<Client[]> {
    return await this.clientRepository.find();
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({ where: { id: id } });

    if (!client) throw new NotFoundException(`Não existe cliente com id ${id}`);

    return client;
  }

  async update(
    id: string,
    updateClientDto: Partial<CreateClientDto>,
  ): Promise<Client> {
    await this.clientRepository.update(id, updateClientDto);

    return await this.findOne(id);
  }
}
