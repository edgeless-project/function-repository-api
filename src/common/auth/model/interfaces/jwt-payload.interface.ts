export interface JwtPayload {
  email?: string;
  role: string;
  jti?: string;
  exp?: number;
  permissions?: string[];
}
