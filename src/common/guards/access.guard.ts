import {ExecutionContext, Injectable, Logger, UnauthorizedException} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import {JwtService} from "@nestjs/jwt";
import {ROLES_KEY} from "@common/decorators/roles.decorator";
import {PERMISSIONS_KEY} from "@common/decorators/permissions.decorator";

@Injectable()
export class AccessGuard extends AuthGuard('jwt') {
  private logger = new Logger('AccessGuard', {timestamp: true});

  constructor(
      private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    try {
      await super.canActivate(context);
    } catch (error) {
     // do nothing
    }
    const roles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
    const permissions = this.reflector.get<string[]>(PERMISSIONS_KEY, context.getHandler());
    const request = context.switchToHttp().getRequest();

    const user: any = request.user;

    const hasRole = roles ? roles.filter(roleName => user && user.role === roleName).length > 0 : null;
    const hasPermission = permissions ?
        user && user.permissions.filter(
            (permission : string) =>  permissions.filter( functionPermission => functionPermission === permission ).length > 0,
        ).length > 0 : null;

    return hasRole === true || hasPermission === true || (hasRole === null && hasPermission === null);//TODO: Delete joker pass
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    // @ts-ignore
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
