import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';
import { Client } from '../../../modules/clients/entities/client.entity';
import { LoggerService } from '../../../common/logger/logger.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly logger: LoggerService,
  ) {
    logger.setContext(RolesGuard.name);
  }

  canActivate(context: ExecutionContext): boolean {
    this.logger.log('Ativando guard de roles');

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    this.logger.log(`Roles requeridos no controller: ${requiredRoles}`);

    if (!requiredRoles) {
      this.logger.log(`Rota sem proteção`);
      return true; // Se não houver roles exigidas, permite o acesso
    }

    const { user } = context.switchToHttp().getRequest<{ user: Client }>();

    const hasPermission = requiredRoles.some((role) => user.role == role);

    if (!hasPermission) {
      this.logger.warn(`Usuário ${user.name} não tem permissão de acesso`);
    }

    return hasPermission;
  }
}
