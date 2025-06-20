export interface JwtPayload {
  id: string;
  email?: string;
  role: string;
  jti?: string;
  exp?: number;
  permissions?: string[];
}

export interface jwtPayloadRequest extends Request {
  user?: JwtPayload;
}
