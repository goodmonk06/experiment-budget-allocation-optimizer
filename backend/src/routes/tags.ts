import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { z } from 'zod';
import { NotFoundError, ConflictError } from '../lib/errors';

const CreateTagSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  description: z.string().optional(),
});

const AssignTagSchema = z.object({
  experimentId: z.string().uuid(),
  tagId: z.string().uuid(),
});

export async function tagRoutes(fastify: FastifyInstance) {
  // Create tag
  fastify.post('/tags', async (request, reply) => {
    const data = CreateTagSchema.parse(request.body);

    const existing = await prisma.experimentTag.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new ConflictError('Tag with this name already exists');
    }

    const tag = await prisma.experimentTag.create({
      data,
    });

    return reply.status(201).send(tag);
  });

  // List tags
  fastify.get('/tags', async (request, reply) => {
    const tags = await prisma.experimentTag.findMany({
      include: {
        assignments: {
          include: {
            experiment: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return reply.send(tags);
  });

  // Get tag by ID
  fastify.get('/tags/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const tag = await prisma.experimentTag.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            experiment: true,
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundError('Tag');
    }

    return reply.send(tag);
  });

  // Delete tag
  fastify.delete('/tags/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    await prisma.experimentTag.delete({
      where: { id },
    });

    return reply.status(204).send();
  });

  // Assign tag to experiment
  fastify.post('/tags/assign', async (request, reply) => {
    const data = AssignTagSchema.parse(request.body);

    const assignment = await prisma.experimentTagAssignment.create({
      data,
      include: {
        experiment: true,
        tag: true,
      },
    });

    return reply.status(201).send(assignment);
  });

  // Remove tag from experiment
  fastify.delete('/tags/assign/:experimentId/:tagId', async (request, reply) => {
    const { experimentId, tagId } = request.params as {
      experimentId: string;
      tagId: string;
    };

    await prisma.experimentTagAssignment.deleteMany({
      where: {
        experimentId,
        tagId,
      },
    });

    return reply.status(204).send();
  });

  // Get experiments by tag
  fastify.get('/tags/:id/experiments', async (request, reply) => {
    const { id } = request.params as { id: string };

    const tag = await prisma.experimentTag.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            experiment: {
              include: {
                metrics: {
                  take: 1,
                  orderBy: { date: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundError('Tag');
    }

    const experiments = tag.assignments.map((a) => a.experiment);

    return reply.send(experiments);
  });
}
