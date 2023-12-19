export interface JwtPayload {
  email?: string;
  role: string;
  jti: string;
  permissions?: string[];
}
