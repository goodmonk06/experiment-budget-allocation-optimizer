import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { CreateExperimentSchema } from '../types';
import { calculateExperimentKPIs } from '../services/kpi-calculator';

export async function experimentRoutes(fastify: FastifyInstance) {
  // Create a new experiment
  fastify.post('/experiments', async (request, reply) => {
    try {
      const data = CreateExperimentSchema.parse(request.body);

      const experiment = await prisma.experiment.create({
        data,
      });

      return reply.status(201).send(experiment);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // Get all experiments
  fastify.get('/experiments', async (request, reply) => {
    const experiments = await prisma.experiment.findMany({
      include: {
        metrics: {
          orderBy: {
            date: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reply.send(experiments);
  });

  // Get a specific experiment
  fastify.get('/experiments/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const experiment = await prisma.experiment.findUnique({
      where: { id },
      include: {
        metrics: {
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    if (!experiment) {
      return reply.status(404).send({ error: 'Experiment not found' });
    }

    return reply.send(experiment);
  });

  // Get experiment KPIs
  fastify.get('/experiments/:id/kpis', async (request, reply) => {
    const { id } = request.params as { id: string };

    const kpis = await calculateExperimentKPIs(id);

    if (!kpis) {
      return reply.status(404).send({ error: 'Experiment not found' });
    }

    return reply.send(kpis);
  });

  // Update experiment status
  fastify.patch('/experiments/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };

    if (!['active', 'paused', 'completed'].includes(status)) {
      return reply.status(400).send({ error: 'Invalid status' });
    }

    try {
      const experiment = await prisma.experiment.update({
        where: { id },
        data: { status },
      });

      return reply.send(experiment);
    } catch (error) {
      return reply.status(404).send({ error: 'Experiment not found' });
    }
  });

  // Delete an experiment
  fastify.delete('/experiments/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await prisma.experiment.delete({
        where: { id },
      });

      return reply.status(204).send();
    } catch (error) {
      return reply.status(404).send({ error: 'Experiment not found' });
    }
  });
}
