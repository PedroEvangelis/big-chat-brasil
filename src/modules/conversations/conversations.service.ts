import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Conversation } from './entities/conversation.entity';
import { Message } from '../messages/entities/message.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  /**
   * Encontra todas as conversas associadas ao cliente autenticado.
   * Geralmente, a lógica para filtrar pelo cliente autenticado seria feita aqui,
   * ou o ID do cliente seria passado como parâmetro.
   * Por simplicidade, este exemplo retorna todas as conversas.
   */
  async findAll(authenticatedUserId): Promise<Conversation[]> {
    // Em um cenário real, você buscaria as conversas do usuário autenticado.
    return this.conversationRepository.find({
      where: { clientId: authenticatedUserId },
    });
  }

  /**
   * Encontra uma conversa específica pelo seu ID.
   * @param id O ID da conversa.
   * @returns Uma Promise que resolve para a conversa encontrada.
   * @throws NotFoundException Se a conversa com o ID fornecido não for encontrada.
   */
  async findOne(id: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversa com ID "${id}" não encontrada.`);
    }
    return conversation;
  }

  /**
   * Encontra todas as mensagens de uma conversa específica.
   * @param conversationId O ID da conversa cujas mensagens serão buscadas.
   * @returns Uma Promise que resolve para um array de mensagens.
   * @throws NotFoundException Se a conversa com o ID fornecido não for encontrada.
   */
  async findMessages(conversationId: string): Promise<Message[]> {
    const conversationExists = await this.conversationRepository.exists({
      where: { id: conversationId },
    });

    if (!conversationExists) {
      throw new NotFoundException(
        `Conversa com ID "${conversationId}" não encontrada.`,
      );
    }

    return this.messageRepository.find({
      where: { conversation: { id: conversationId } },
      order: { createDateTime: 'ASC' },
    });
  }
}
