import type { FastifyRequest } from 'fastify';

export interface RouterMiddlewareContext {
  request: FastifyRequest;
  headers: Headers;
}

export type RouterMiddleware = (context: RouterMiddlewareContext) => void;
