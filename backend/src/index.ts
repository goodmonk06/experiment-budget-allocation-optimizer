import Fastify from 'fastify';
import cors from '@fastify/cors';
import { experimentRoutes } from './routes/experiments';
import { metricRoutes } from './routes/metrics';
import { allocationRoutes } from './routes/allocations';

const PORT = parseInt(process.env.PORT || '3001', 10);

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

async function start() {
  try {
    // Register CORS
    await fastify.register(cors, {
      origin: true, // Allow all origins in development
    });

    // Health check
    fastify.get('/health', async (request, reply) => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Register routes
    await fastify.register(experimentRoutes, { prefix: '/api' });
    await fastify.register(metricRoutes, { prefix: '/api' });
    await fastify.register(allocationRoutes, { prefix: '/api' });

    // Start server
    await fastify.listen({ port: PORT, host: '0.0.0.0' });

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║  Budget Allocation Optimizer API                          ║
║  Server running on http://localhost:${PORT}                 ║
╚═══════════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
