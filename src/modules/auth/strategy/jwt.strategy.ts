import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Client } from '../../clients/entities/client.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/common/enums/Role.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Deixe false para que o Passport lide com a expiração
      secretOrKey: process.env.JWT_SECRET || '',
    });
  }

  async validate(payload: { id: string; name: string; role: Role }) {
    const client = await this.clientRepository.findOne({
      where: { id: payload.id },
    });

    if (!client) {
      throw new UnauthorizedException('Cliente não encontrado.');
    }

    if (!client.active) {
      throw new UnauthorizedException('Cliente inativo.');
    }

    return client;
  }
}
