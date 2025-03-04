import {ExecutionContext, forwardRef, Inject, Injectable, Logger} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ROLES_KEY, IS_API_KEY } from "@common/decorators/roles.decorator";
import { PERMISSIONS_KEY } from "@common/decorators/permissions.decorator";
import { ApikeyGard } from "@common/guards/apikey.gard";
import { IS_PUBLIC_KEY } from "@common/decorators/public.decorator";

@Injectable()
export class AccessGuard extends AuthGuard('jwt') {
  private logger = new Logger('AccessGuard', {timestamp: true});

  constructor(
      private readonly reflector: Reflector,
      @Inject(forwardRef(()=> ApikeyGard)) private apikeyGard: ApikeyGard) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    try {
      await super.canActivate(context);
    } catch (error) {
     // do nothing
    }
    //Roles and permissions
    const roles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
    const isAPIKey = await this.apikeyGard.canActivate(context);
    const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
    //Environment variables
    const request = context.switchToHttp().getRequest();
    const user: any = request.user;
    //Check permissions
    const accessibleAPIKey = roles.includes(IS_API_KEY);
    const hasRole = roles ? roles.filter(roleName => user && user.role === roleName).length > 0 : null;

    return !!isPublic || (isAPIKey && accessibleAPIKey) || hasRole === true;
  }
}
