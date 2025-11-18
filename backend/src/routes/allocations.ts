import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { AllocationConfigSchema } from '../types';
import { calculateAllExperimentKPIs } from '../services/kpi-calculator';
import { calculateAllocationSuggestions } from '../services/allocation-engine';

export async function allocationRoutes(fastify: FastifyInstance) {
  // Generate allocation suggestion
  fastify.post('/allocations/suggest', async (request, reply) => {
    try {
      const config = AllocationConfigSchema.parse(request.body || {});

      // Get KPIs for all experiments
      const kpis = await calculateAllExperimentKPIs();

      if (kpis.length === 0) {
        return reply.status(400).send({ error: 'No experiments found' });
      }

      // Generate allocation suggestions
      const suggestions = calculateAllocationSuggestions(kpis, config);

      // Save the suggestion to database
      const allocationSuggestion = await prisma.allocationSuggestion.create({
        data: {
          inputJson: {
            config,
            experimentCount: kpis.length,
            timestamp: new Date().toISOString(),
          },
          suggestionJson: suggestions,
        },
      });

      return reply.send({
        id: allocationSuggestion.id,
        createdAt: allocationSuggestion.createdAt,
        suggestions,
        config,
      });
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // Get all allocation suggestions (history)
  fastify.get('/allocations', async (request, reply) => {
    const suggestions = await prisma.allocationSuggestion.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, // Limit to last 20 suggestions
    });

    return reply.send(suggestions);
  });

  // Get a specific allocation suggestion
  fastify.get('/allocations/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const suggestion = await prisma.allocationSuggestion.findUnique({
      where: { id },
    });

    if (!suggestion) {
      return reply.status(404).send({ error: 'Allocation suggestion not found' });
    }

    return reply.send(suggestion);
  });

  // Get current KPIs for all experiments
  fastify.get('/allocations/kpis/current', async (request, reply) => {
    const kpis = await calculateAllExperimentKPIs();
    return reply.send(kpis);
  });
}
