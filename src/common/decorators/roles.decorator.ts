import { SetMetadata } from '@nestjs/common';

export const IS_API_KEY = 'isApiKey';
export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
