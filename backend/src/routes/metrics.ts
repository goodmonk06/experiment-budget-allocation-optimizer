import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { UpsertMetricSchema } from '../types';

export async function metricRoutes(fastify: FastifyInstance) {
  // Upsert daily metrics for an experiment
  fastify.post('/metrics', async (request, reply) => {
    try {
      const data = UpsertMetricSchema.parse(request.body);

      // Verify experiment exists
      const experiment = await prisma.experiment.findUnique({
        where: { id: data.experimentId },
      });

      if (!experiment) {
        return reply.status(404).send({ error: 'Experiment not found' });
      }

      // Upsert metric snapshot
      const metric = await prisma.experimentMetricSnapshot.upsert({
        where: {
          experimentId_date: {
            experimentId: data.experimentId,
            date: new Date(data.date),
          },
        },
        update: {
          spend: data.spend,
          impressions: data.impressions,
          clicks: data.clicks,
          conversions: data.conversions,
          revenue: data.revenue,
        },
        create: {
          experimentId: data.experimentId,
          date: new Date(data.date),
          spend: data.spend,
          impressions: data.impressions,
          clicks: data.clicks,
          conversions: data.conversions,
          revenue: data.revenue,
        },
      });

      return reply.status(201).send(metric);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // Bulk upsert metrics
  fastify.post('/metrics/bulk', async (request, reply) => {
    try {
      const metrics = request.body as any[];

      if (!Array.isArray(metrics)) {
        return reply.status(400).send({ error: 'Expected an array of metrics' });
      }

      const results = [];

      for (const metricData of metrics) {
        const data = UpsertMetricSchema.parse(metricData);

        const metric = await prisma.experimentMetricSnapshot.upsert({
          where: {
            experimentId_date: {
              experimentId: data.experimentId,
              date: new Date(data.date),
            },
          },
          update: {
            spend: data.spend,
            impressions: data.impressions,
            clicks: data.clicks,
            conversions: data.conversions,
            revenue: data.revenue,
          },
          create: {
            experimentId: data.experimentId,
            date: new Date(data.date),
            spend: data.spend,
            impressions: data.impressions,
            clicks: data.clicks,
            conversions: data.conversions,
            revenue: data.revenue,
          },
        });

        results.push(metric);
      }

      return reply.status(201).send({
        success: true,
        count: results.length,
        metrics: results,
      });
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // Get metrics for an experiment
  fastify.get('/metrics/:experimentId', async (request, reply) => {
    const { experimentId } = request.params as { experimentId: string };

    const metrics = await prisma.experimentMetricSnapshot.findMany({
      where: { experimentId },
      orderBy: {
        date: 'desc',
      },
    });

    return reply.send(metrics);
  });
}
