import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AccessGuard extends AuthGuard('jwt') {

  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    try {
      await super.canActivate(context);
    } catch (error) {
     // do nothing
    }
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    const permissions = this.reflector.get<string[]>('permissions', context.getHandler());
    const request = context.switchToHttp().getRequest();
    const user: any = request.user;

    const hasRole = roles ? roles.filter(roleName => user && user.role === roleName).length > 0 : null;
    const hasPermission = permissions ?
        user && user.permissions.filter(
           permission =>  permissions.filter( functionPermission => functionPermission === permission ).length > 0,
        ).length > 0 : null;
    return hasRole === true || hasPermission === true || (hasRole === null && hasPermission === null);
  }
}
