import {ExecutionContext, forwardRef, Inject, Injectable, Logger} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ROLES_KEY, IS_API_KEY } from "@common/decorators/roles.decorator";
import { ApikeyGard } from "@common/guards/apikey.gard";
import { IS_PUBLIC_KEY } from "@common/decorators/public.decorator";
import {jwtPayloadRequest} from "@common/auth/model/interfaces/jwt-payload.interface";

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
    const accessibleAPIKey = roles?.includes(IS_API_KEY);
    let isAPIKeyValid = false;
    const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
    //Check Valid API Key
    if(accessibleAPIKey) isAPIKeyValid = await this.apikeyGard.canActivate(context);
    //Environment variables
    const request: jwtPayloadRequest = context.switchToHttp().getRequest();
    const user = request.user;

    //Check correct role
    const hasRole = !!roles?.filter(roleName => user?.role === roleName).length;
    return !!isPublic || (isAPIKeyValid && accessibleAPIKey) || hasRole;
  }
}
