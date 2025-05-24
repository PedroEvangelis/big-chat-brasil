import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Client } from '../../clients/entities/client.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../../common/enums/Role.enum';
import { LoggerService } from '../../../common/logger/logger.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    private readonly logger: LoggerService,
  ) {
    logger.setContext(JwtStrategy.name);

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new NotFoundException(
        'Não foi possível encotrar o secret do tonken',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Deixe false para que o Passport lide com a expiração
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: { id: string; name: string; role: Role }) {
    this.logger.log('Validando payload');
    this.logger.log(payload);

    const client = await this.clientRepository.findOne({
      where: { id: payload.id },
    });

    if (!client) {
      this.logger.warn('Cliente não encontrado!');
      throw new UnauthorizedException('[JwtStrategy] Cliente não encontrado.');
    }

    if (!client.active) {
      this.logger.log('Usuário intativo!');
      throw new UnauthorizedException('Cliente inativo.');
    }

    return client;
  }
}
