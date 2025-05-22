import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Client } from '../clients/entities/client.entity';
import { LoginRequestDto, LoginResponseDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Plan } from '../../common/enums/Plan.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    const { documentId } = loginDto;

    // Procura o cliente pelo CPF ou CNPJ
    const client = await this.clientRepository.findOne({
      where: { documentId: documentId },
    });

    if (!client) {
      throw new UnauthorizedException('Cliente não encontrado.');
    }

    if (!client.active) {
      throw new UnauthorizedException('Cliente inativo.');
    }

    const payload = { id: client.id, name: client.name, role: client.role };
    const accessToken = this.jwtService.sign(payload);

    const { limit, balance, role, ...user } = client;

    if (client.planType === Plan.POSTPAID) {
      return { client: { ...user, limit: limit }, token: accessToken };
    }

    return { client: { ...user, balance: balance }, token: accessToken };
  }
}
