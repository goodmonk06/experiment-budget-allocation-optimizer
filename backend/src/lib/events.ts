import { logger } from './logger';

// Domain event types
export type DomainEventType =
  | 'experiment.created'
  | 'experiment.updated'
  | 'experiment.deleted'
  | 'allocation.generated'
  | 'allocation.applied'
  | 'budget_plan.created'
  | 'budget_plan.updated'
  | 'alert.triggered'
  | 'metrics.ingested';

export interface DomainEvent<T = unknown> {
  type: DomainEventType;
  timestamp: Date;
  data: T;
  metadata?: Record<string, unknown>;
}

export type EventHandler<T = unknown> = (event: DomainEvent<T>) => void | Promise<void>;

class EventBus {
  private handlers: Map<DomainEventType, Set<EventHandler>> = new Map();

  subscribe<T = unknown>(eventType: DomainEventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler as EventHandler);

    logger.debug({ eventType }, 'Event handler subscribed');

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler as EventHandler);
    };
  }

  async emit<T = unknown>(event: DomainEvent<T>): Promise<void> {
    const handlers = this.handlers.get(event.type);

    if (!handlers || handlers.size === 0) {
      logger.debug({ eventType: event.type }, 'No handlers for event');
      return;
    }

    logger.info({ eventType: event.type, handlerCount: handlers.size }, 'Emitting event');

    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        logger.error({ error, eventType: event.type }, 'Event handler failed');
      }
    });

    await Promise.all(promises);
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();

// Helper functions for creating events
export function createEvent<T>(
  type: DomainEventType,
  data: T,
  metadata?: Record<string, unknown>
): DomainEvent<T> {
  return {
    type,
    timestamp: new Date(),
    data,
    metadata,
  };
}
