import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { z } from 'zod';
import { NotFoundError } from '../lib/errors';
import { createEvent, eventBus } from '../lib/events';
import { calculateExperimentKPIs } from '../services/kpi-calculator';
import { notificationService } from '../lib/adapters/notification';

const CreateAlertSchema = z.object({
  experimentId: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  metricName: z.enum(['roas', 'ctr', 'cac', 'conversionRate']),
  operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte']),
  threshold: z.number(),
});

const UpdateAlertSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  threshold: z.number().optional(),
  status: z.enum(['active', 'paused', 'triggered']).optional(),
});

export async function alertRoutes(fastify: FastifyInstance) {
  // Create alert
  fastify.post('/alerts', async (request, reply) => {
    const data = CreateAlertSchema.parse(request.body);

    const alert = await prisma.performanceAlert.create({
      data,
      include: {
        experiment: true,
      },
    });

    return reply.status(201).send(alert);
  });

  // List alerts
  fastify.get('/alerts', async (request, reply) => {
    const alerts = await prisma.performanceAlert.findMany({
      include: {
        experiment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reply.send(alerts);
  });

  // Get alert by ID
  fastify.get('/alerts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const alert = await prisma.performanceAlert.findUnique({
      where: { id },
      include: {
        experiment: true,
      },
    });

    if (!alert) {
      throw new NotFoundError('Alert');
    }

    return reply.send(alert);
  });

  // Update alert
  fastify.patch('/alerts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = UpdateAlertSchema.parse(request.body);

    const alert = await prisma.performanceAlert.update({
      where: { id },
      data,
      include: {
        experiment: true,
      },
    });

    return reply.send(alert);
  });

  // Delete alert
  fastify.delete('/alerts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    await prisma.performanceAlert.delete({
      where: { id },
    });

    return reply.status(204).send();
  });

  // Check alerts (evaluate all active alerts)
  fastify.post('/alerts/check', async (request, reply) => {
    const alerts = await prisma.performanceAlert.findMany({
      where: { status: 'active' },
      include: {
        experiment: true,
      },
    });

    const triggeredAlerts: string[] = [];

    for (const alert of alerts) {
      if (!alert.experimentId) continue;

      const kpis = await calculateExperimentKPIs(alert.experimentId);
      if (!kpis) continue;

      const metricValue = kpis[alert.metricName as keyof typeof kpis] as number;
      const isTriggered = evaluateCondition(
        metricValue,
        alert.operator,
        alert.threshold
      );

      if (isTriggered) {
        await prisma.performanceAlert.update({
          where: { id: alert.id },
          data: {
            status: 'triggered',
            lastTriggered: new Date(),
            triggerCount: { increment: 1 },
          },
        });

        await eventBus.emit(
          createEvent('alert.triggered', {
            alert,
            experiment: alert.experiment,
            metricValue,
          })
        );

        await notificationService.notify({
          title: `Alert Triggered: ${alert.name}`,
          message: `${alert.experiment?.name}: ${alert.metricName} is ${metricValue}, threshold was ${alert.operator} ${alert.threshold}`,
          severity: 'warning',
          metadata: {
            alertId: alert.id,
            experimentId: alert.experimentId,
            metricName: alert.metricName,
            metricValue,
            threshold: alert.threshold,
          },
        });

        triggeredAlerts.push(alert.id);
      }
    }

    return reply.send({
      checked: alerts.length,
      triggered: triggeredAlerts.length,
      triggeredAlertIds: triggeredAlerts,
    });
  });
}

function evaluateCondition(value: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case 'gt':
      return value > threshold;
    case 'lt':
      return value < threshold;
    case 'eq':
      return value === threshold;
    case 'gte':
      return value >= threshold;
    case 'lte':
      return value <= threshold;
    default:
      return false;
  }
}
