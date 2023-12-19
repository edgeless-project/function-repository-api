import { RequestHandler } from 'express';
import { parse } from 'url';
import { Logger } from '@nestjs/common';

const logger = new Logger('LoggerMiddleware', { timestamp: true});

export const loggerMiddleware: RequestHandler = (request, response, next) => {
  const { headers, method, query, params } = request;
  const date = new Date().toJSON();
  const time = date.replace('T', ' ').slice(0, -5);
  const route = parse(request.url).path;
  logger.log(`${time} ~ ${method} ${route || '/'}`); // tslint:disable-line no-console
  next();
};
