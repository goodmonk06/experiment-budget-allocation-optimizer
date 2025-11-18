import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { z } from 'zod';
import { NotFoundError, ValidationError } from '../lib/errors';
import { createEvent, eventBus } from '../lib/events';

const CreateBudgetPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  groupId: z.string().uuid().optional(),
  totalBudget: z.number().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  strategyId: z.string().uuid().optional(),
});

const UpdateBudgetPlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  totalBudget: z.number().positive().optional(),
  status: z.enum(['draft', 'active', 'completed']).optional(),
});

export async function budgetPlanRoutes(fastify: FastifyInstance) {
  // Create budget plan
  fastify.post('/budget-plans', async (request, reply) => {
    const data = CreateBudgetPlanSchema.parse(request.body);

    const budgetPlan = await prisma.budgetPlan.create({
      data: {
        name: data.name,
        description: data.description,
        groupId: data.groupId,
        totalBudget: data.totalBudget,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        strategyId: data.strategyId,
      },
      include: {
        group: true,
        strategy: true,
      },
    });

    await eventBus.emit(
      createEvent('budget_plan.created', budgetPlan)
    );

    return reply.status(201).send(budgetPlan);
  });

  // List budget plans
  fastify.get('/budget-plans', async (request, reply) => {
    const budgetPlans = await prisma.budgetPlan.findMany({
      include: {
        group: true,
        strategy: true,
        allocations: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reply.send(budgetPlans);
  });

  // Get budget plan by ID
  fastify.get('/budget-plans/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const budgetPlan = await prisma.budgetPlan.findUnique({
      where: { id },
      include: {
        group: true,
        strategy: true,
        allocations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!budgetPlan) {
      throw new NotFoundError('Budget plan');
    }

    return reply.send(budgetPlan);
  });

  // Update budget plan
  fastify.patch('/budget-plans/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = UpdateBudgetPlanSchema.parse(request.body);

    const budgetPlan = await prisma.budgetPlan.update({
      where: { id },
      data,
      include: {
        group: true,
        strategy: true,
      },
    });

    await eventBus.emit(
      createEvent('budget_plan.updated', budgetPlan)
    );

    return reply.send(budgetPlan);
  });

  // Delete budget plan
  fastify.delete('/budget-plans/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    await prisma.budgetPlan.delete({
      where: { id },
    });

    return reply.status(204).send();
  });
}
