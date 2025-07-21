import { RequestHandler } from 'express';
import { URL } from 'url';
import { Logger } from '@nestjs/common';

const logger = new Logger('LoggerMiddleware', { timestamp: true});

export const loggerMiddleware: RequestHandler = (request, response, next) => {
	const { method } = request;
	const date = new Date().toJSON();
	const time = date.replace('T', ' ').slice(0, -5);
	const url = new URL(request.url, `http://${request.headers.host}`);
	const route = url.pathname + url.search;
	logger.log(`${time} ~ ${method} ${route || '/'}`);
	next();
};
