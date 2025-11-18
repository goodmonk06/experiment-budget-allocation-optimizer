import Fastify from 'fastify';
import cors from '@fastify/cors';
import { experimentRoutes } from './routes/experiments';
import { metricRoutes } from './routes/metrics';
import { allocationRoutes } from './routes/allocations';
import { budgetPlanRoutes } from './routes/budget-plans';
import { alertRoutes } from './routes/alerts';
import { tagRoutes } from './routes/tags';
import { groupRoutes } from './routes/groups';
import { errorHandler } from './lib/errors';
import { logger } from './lib/logger';

const PORT = parseInt(process.env.PORT || '3001', 10);

const fastify = Fastify({
  logger,
  disableRequestLogging: false,
});

async function start() {
  try {
    // Register CORS
    await fastify.register(cors, {
      origin: process.env.NODE_ENV === 'production'
        ? (process.env.CORS_ORIGIN || '').split(',')
        : true,
    });

    // Global error handler
    fastify.setErrorHandler(errorHandler);

    // Health check
    fastify.get('/health', async (request, reply) => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Register routes
    await fastify.register(experimentRoutes, { prefix: '/api' });
    await fastify.register(metricRoutes, { prefix: '/api' });
    await fastify.register(allocationRoutes, { prefix: '/api' });
    await fastify.register(budgetPlanRoutes, { prefix: '/api' });
    await fastify.register(alertRoutes, { prefix: '/api' });
    await fastify.register(tagRoutes, { prefix: '/api' });
    await fastify.register(groupRoutes, { prefix: '/api' });

    // Start server
    await fastify.listen({ port: PORT, host: '0.0.0.0' });

    logger.info(`
╔═══════════════════════════════════════════════════════════╗
║  Budget Allocation Optimizer API                          ║
║  Server running on http://localhost:${PORT}                 ║
╚═══════════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing server gracefully');
  await fastify.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing server gracefully');
  await fastify.close();
  process.exit(0);
});

start();
