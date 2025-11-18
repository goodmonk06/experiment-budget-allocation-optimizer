import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { z } from 'zod';
import { NotFoundError } from '../lib/errors';

const CreateGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
});

const UpdateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
});

export async function groupRoutes(fastify: FastifyInstance) {
  // Create group
  fastify.post('/groups', async (request, reply) => {
    const data = CreateGroupSchema.parse(request.body);

    const group = await prisma.experimentGroup.create({
      data,
      include: {
        parent: true,
      },
    });

    return reply.status(201).send(group);
  });

  // List groups
  fastify.get('/groups', async (request, reply) => {
    const groups = await prisma.experimentGroup.findMany({
      include: {
        parent: true,
        children: true,
        experiments: {
          include: {
            metrics: {
              take: 1,
              orderBy: { date: 'desc' },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return reply.send(groups);
  });

  // Get group by ID
  fastify.get('/groups/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const group = await prisma.experimentGroup.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        experiments: {
          include: {
            metrics: {
              orderBy: { date: 'desc' },
            },
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
        budgetPlans: {
          include: {
            strategy: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundError('Experiment group');
    }

    return reply.send(group);
  });

  // Update group
  fastify.patch('/groups/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = UpdateGroupSchema.parse(request.body);

    const group = await prisma.experimentGroup.update({
      where: { id },
      data,
      include: {
        parent: true,
        children: true,
        experiments: true,
      },
    });

    return reply.send(group);
  });

  // Delete group
  fastify.delete('/groups/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    await prisma.experimentGroup.delete({
      where: { id },
    });

    return reply.status(204).send();
  });

  // Get group hierarchy (tree view)
  fastify.get('/groups/tree', async (request, reply) => {
    const rootGroups = await prisma.experimentGroup.findMany({
      where: {
        parentId: null,
      },
      include: {
        children: {
          include: {
            children: true,
            experiments: true,
          },
        },
        experiments: true,
      },
    });

    return reply.send(rootGroups);
  });
}
