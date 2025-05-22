import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { Client } from './entities/client.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/user.decorator';
import { Role } from '../../common/enums/Role.enum';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

/**
 * Controller responsável por lidar com as requisições relacionadas a clientes.
 *
 * @remarks
 * Este controller gerencia a criação, busca, atualização e visualização de saldo de clientes.
 * Ele utiliza guardas de autenticação e autorização para proteger as rotas.
 */
@ApiTags('clients') // Adiciona uma tag para agrupar as rotas no Swagger UI
@Controller('clients')
export class ClientsController {
  /**
   * Construtor do ClientsController.
   * @param clientsService O serviço de clientes injetado.
   */
  constructor(private readonly clientsService: ClientsService) {}

  /**
   * Retorna uma lista de todos os clientes.
   * Requer autenticação JWT e que o usuário tenha a função de 'ADMIN'.
   *
   * @returns Uma Promise que resolve para um array de objetos Client.
   */
  @Get()
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Obtém todos os clientes (apenas para ADMINS)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de clientes retornada com sucesso',
    type: [Client],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso proibido' })
  async findAll(): Promise<Client[]> {
    return this.clientsService.findAll();
  }

  /**
   * Cria um novo cliente.
   *
   * @param createClientDto Os dados para a criação do cliente.
   * @returns Uma Promise que resolve para o objeto Client recém-criado.
   */
  @Post()
  @ApiOperation({ summary: 'Cria um novo cliente' })
  @ApiResponse({
    status: 201,
    description: 'Cliente criado com sucesso',
    type: Client,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Já existe um cliente com o documento informado',
  })
  async create(@Body() createClientDto: CreateClientDto): Promise<Client> {
    return this.clientsService.create(createClientDto);
  }

  /**
   * Busca um cliente pelo seu ID.
   *
   * @param id O ID do cliente a ser buscado.
   * @returns Uma Promise que resolve para o objeto Client encontrado.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtém um cliente por ID' })
  @ApiResponse({
    status: 200,
    description: 'Cliente buscado com sucesso',
    type: Client,
  })
  @ApiResponse({
    status: 404,
    description: 'ID de cliente inválido ou cliente não encontrado/inativo',
  })
  async findOne(@Param('id') id: string): Promise<Client> {
    return this.clientsService.findOne(id);
  }

  /**
   * Atualiza os dados de um cliente.
   * Requer autenticação JWT. O usuário autenticado só pode atualizar seu próprio perfil.
   *
   * @param user O objeto Client do usuário autenticado.
   * @param id O ID do cliente a ser atualizado.
   * @param updateClientDto Os dados parciais para atualização do cliente.
   * @returns Uma Promise que resolve para o objeto Client atualizado.
   * @throws UnauthorizedException Se o usuário tentar atualizar um perfil que não é o seu.
   */
  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Atualiza os dados de um cliente' })
  @ApiResponse({
    status: 200,
    description: 'Cliente atualizado com sucesso',
    type: Client,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso proibido a este recurso' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  async update(
    @GetUser() user: Client, // Usuário autenticado
    @Param('id') id: string,
    @Body() updateClientDto: Partial<CreateClientDto>,
  ): Promise<Client> {
    if (user.id !== id) {
      throw new UnauthorizedException('Acesso não autorizado a este recurso.');
    }
    return this.clientsService.update(id, updateClientDto);
  }

  /**
   * Retorna o saldo e o limite de um cliente.
   * Requer autenticação JWT. O usuário autenticado só pode ver o saldo do seu próprio perfil.
   *
   * @param id O ID do cliente.
   * @param user O objeto Client do usuário autenticado.
   * @returns Uma Promise que resolve para um objeto contendo o saldo e o limite do cliente.
   * @throws UnauthorizedException Se o usuário tentar acessar o saldo de outro cliente.
   */
  @Get(':id/balance')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Obtém o saldo e limite de um cliente' })
  @ApiResponse({
    status: 200,
    description: 'Saldo e limite do cliente retornados com sucesso',
    schema: {
      type: 'object',
      properties: {
        balance: { type: 'number', example: 1000.5 },
        limit: { type: 'number', example: 5000.0 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso proibido a este recurso' })
  @ApiResponse({
    status: 404,
    description: 'ID de cliente inválido ou cliente não encontrado',
  })
  async getBalance(
    @Param('id') id: string,
    @GetUser() user: Client, // Usuário autenticado
  ): Promise<{ balance: number; limit: number }> {
    if (user.id !== id) {
      throw new UnauthorizedException('Acesso não autorizado a este recurso.');
    }

    const client = await this.clientsService.findOne(id);
    return { balance: client.balance, limit: client.limit };
  }
}
