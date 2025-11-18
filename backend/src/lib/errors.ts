import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { logger } from './logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: unknown;
  };
}

export function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  logger.error(
    {
      err: error,
      url: request.url,
      method: request.method,
    },
    'Error occurred'
  );

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const response: ErrorResponse = {
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: error.errors,
      },
    };
    reply.status(400).send(response);
    return;
  }

  // Handle our custom AppErrors
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: {
        message: error.message,
        code: error.constructor.name.replace(/Error$/, '').toUpperCase(),
        statusCode: error.statusCode,
      },
    };
    reply.status(error.statusCode).send(response);
    return;
  }

  // Handle Prisma errors
  if (error.constructor.name.includes('Prisma')) {
    const response: ErrorResponse = {
      error: {
        message: 'Database error occurred',
        code: 'DATABASE_ERROR',
        statusCode: 500,
      },
    };
    reply.status(500).send(response);
    return;
  }

  // Default error response
  const response: ErrorResponse = {
    error: {
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message,
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    },
  };
  reply.status(500).send(response);
}
