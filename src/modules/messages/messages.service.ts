import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { Client } from '../clients/entities/client.entity';
import { Priority } from '../../common/enums/Priority.enum';
import { Conversation } from '../conversations/entities/conversation.entity';
import { LoggerService } from '../../common/logger/logger.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Conversation)
    private readonly convarsationRepository: Repository<Conversation>,
    private readonly logger: LoggerService,
    private readonly queueService: QueueService,
  ) {
    this.logger.setContext(MessagesService.name);
  }
  /**
   * Cria uma nova mensagem no banco de dados.
   * @param createMessageDto O DTO contendo os dados para a criação da mensagem.
   * @returns A mensagem criada.
   */
  async create(
    createMessageDto: CreateMessageDto,
    clientId: string,
  ): Promise<Message> {
    // Log: Início do processo de criação da mensagem.
    this.logger.log(
      `Iniciando a criação da mensagem para o cliente ID: ${clientId}`,
    );
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });

    if (!client) {
      // Log: Aviso de usuário não encontrado.
      this.logger.warn(
        `Usuário com ID: ${clientId} não encontrado. Lançando UnauthorizedException.`,
      );
      throw new UnauthorizedException(
        'Sem autorização para acessar esse recurso',
      );
    }

    // Log: Cliente encontrado.
    this.logger.log(
      `Cliente ID: ${clientId} encontrado. Iniciando cálculo de custo da mensagem.`,
    );
    //Debita do usuário o valor da mensagem
    const cost = createMessageDto.priority === Priority.NORMAL ? 0.25 : 0.5;
    // Log: Custo da mensagem debitado.
    this.logger.log(
      `Custo de R$${cost.toFixed(2)} para mensagem de prioridade '${createMessageDto.priority}' será debitado do cliente ID: ${clientId}.`,
    );
    client.debit(cost);
    let conversation = await this.convarsationRepository.findOne({
      where: { clientId: client.id },
    });
    if (!conversation) {
      // Log: Criando nova conversa.
      this.logger.log(
        `Nenhuma conversa existente encontrada para o cliente ID: ${clientId} com o destinatário ${createMessageDto.recipientId}. Criando nova conversa.`,
      );
      //Cria nova conversa com a pessoa
      conversation = await this.convarsationRepository.create({
        clientId: client.id,
        recipientId: createMessageDto.recipientId,
        unreadCount: 0,
      });
      // Log: Nova conversa criada.
      this.logger.log(
        `Nova conversa criada com ID provisório para cliente ID: ${client.id} e destinatário ID: ${createMessageDto.recipientId}.`,
      );
    } else {
      // Log: Conversa existente encontrada.
      this.logger.log(
        `Conversa existente encontrada com ID: ${conversation.id} para o cliente ID: ${clientId} e destinatário ID: ${createMessageDto.recipientId}.`,
      );
    }
    conversation.lastMessageContent = createMessageDto.content;
    conversation.unreadCount += 1;
    // Log: Atualizando dados da conversa.
    this.logger.log(
      `Conteúdo da última mensagem e contador de mensagens não lidas atualizados para a conversa ID: ${conversation.id}.`,
    );
    await this.convarsationRepository.save(conversation);
    // Log: Conversa salva no banco de dados.
    this.logger.log(
      `Conversa ID: ${conversation.id} salva/atualizada no banco de dados.`,
    );
    const newMessage = this.messageRepository.create({
      ...createMessageDto,
      conversationId: conversation.id,
      senderId: client.id,
    });
    // Log: Nova entidade de mensagem criada.
    this.logger.log(`Nova entidade de mensagem criada a partir do DTO.`);

    // Salva a nova mensagem no banco de dados
    const message = await this.messageRepository.save(newMessage);
    // Log: Mensagem salva com sucesso.
    this.logger.log(
      `Mensagem com ID: ${message.id} salva com sucesso no banco de dados.`,
    );
    //Enfileira
    this.queueService.addMessageToQueue(
      message,
      message.priority === Priority.NORMAL,
    );
    // Log: Mensagem adicionada à fila.
    this.logger.log(
      `Mensagem com ID: ${message.id} adicionada à fila de processamento (prioridade normal: ${message.priority === Priority.NORMAL}).`,
    );
    //Debita saldo
    await this.clientRepository.save(client);
    // Log: Saldo do cliente atualizado.
    this.logger.log(
      `Saldo do cliente ID: ${client.id} atualizado no banco de dados.`,
    );
    // Log: Mensagem retornada.
    this.logger.log(
      `Processo de criação de mensagem concluído para mensagem ID: ${message.id}.`,
    );
    return message;
  }
  /**
   * Retorna todas as mensagens do banco de dados.
   * Pode ser estendido para incluir filtros e paginação.
   * @returns Uma lista de todas as mensagens.
   */
  async findAll(clientId: string): Promise<Message[]> {
    this.logger.log(
      `Buscando todas as mensagens para o cliente ID: ${clientId}.`,
    );
    const messages = await this.messageRepository.find({
      where: { senderId: clientId },
    });
    this.logger.log(
      `Encontradas ${messages.length} mensagens para o cliente ID: ${clientId}.`,
    );
    return messages;
  }
  /**
   * Busca uma mensagem específica pelo seu ID.
   * @param id O ID da mensagem a ser buscada.
   * @returns A mensagem encontrada.
   * @throws NotFoundException Se a mensagem com o ID fornecido não for encontrada.
   */
  async findOne(id: string, clientId: string): Promise<Message> {
    this.logger.log(
      `Buscando mensagem com ID: ${id} para o cliente ID: ${clientId}.`,
    );
    const message = await this.messageRepository.findOne({
      where: { id: id, senderId: clientId },
    });

    if (!message) {
      this.logger.warn(
        `Mensagem com ID: ${id} não encontrada para o cliente ID: ${clientId}. Lançando NotFoundException.`,
      );
      throw new NotFoundException(`Message with ID "${id}" not found`);
    }
    this.logger.log(
      `Mensagem com ID: ${id} encontrada para o cliente ID: ${clientId}.`,
    );
    return message;
  }
  /**
   * Verifica e retorna o status de uma mensagem específica.
   * Este método é um exemplo e pode ser ajustado para refletir a lógica de status real da sua aplicação.
   * @param id O ID da mensagem para verificar o status.
   * @returns Um objeto contendo o status da mensagem.
   * @throws NotFoundException Se a mensagem com o ID fornecido não for encontrada.
   */
  async findStatus(id: string, userId: string): Promise<{ status: string }> {
    this.logger.log(`Buscando status da mensagem com ID: ${id}.`);
    const message = await this.messageRepository.findOne({
      where: { id: id, senderId: userId },
    });

    if (!message) {
      this.logger.warn(
        `Mensagem com ID: ${id} não encontrada. Lançando NotFoundException.`,
      );
      throw new NotFoundException(`Message with ID "${id}" not found`);
    }
    this.logger.log(`Status da mensagem ID: ${id} é: ${message.status}.`);
    return { status: message.status };
  }
}
