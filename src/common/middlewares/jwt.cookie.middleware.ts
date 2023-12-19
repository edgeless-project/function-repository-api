import { RequestHandler } from 'express';

export function jwtCookieMiddlewareGenerator(jwtAccessCookieName: string, jwtRefreshCookieName: string): RequestHandler {
  return (request, response, next) => {
    if (request.cookies[jwtAccessCookieName]) {
      request.headers.authorization = 'Bearer ' + request.cookies[jwtAccessCookieName];
    }
    if (request.cookies[jwtRefreshCookieName]) {
      request.body = {
        accessToken: request.cookies[jwtAccessCookieName],
        refreshToken : request.cookies[jwtRefreshCookieName],
      };
    }
    next();
  };
}
