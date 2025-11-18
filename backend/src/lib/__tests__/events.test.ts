import { describe, it, expect, beforeEach } from 'vitest';
import { eventBus, createEvent } from '../events';

describe('Event System', () => {
  beforeEach(() => {
    eventBus.clear();
  });

  it('should subscribe to events', () => {
    let called = false;
    const handler = () => {
      called = true;
    };

    eventBus.subscribe('experiment.created', handler);
    expect(called).toBe(false);
  });

  it('should emit events to subscribers', async () => {
    let receivedEvent: any = null;
    const handler = (event: any) => {
      receivedEvent = event;
    };

    eventBus.subscribe('experiment.created', handler);

    const event = createEvent('experiment.created', { id: '123', name: 'Test' });
    await eventBus.emit(event);

    expect(receivedEvent).toEqual(event);
  });

  it('should handle multiple subscribers', async () => {
    const callCounts = [0, 0, 0];

    eventBus.subscribe('experiment.created', () => callCounts[0]++);
    eventBus.subscribe('experiment.created', () => callCounts[1]++);
    eventBus.subscribe('experiment.created', () => callCounts[2]++);

    const event = createEvent('experiment.created', {});
    await eventBus.emit(event);

    expect(callCounts).toEqual([1, 1, 1]);
  });

  it('should allow unsubscribing', async () => {
    let callCount = 0;
    const handler = () => callCount++;

    const unsubscribe = eventBus.subscribe('experiment.created', handler);

    await eventBus.emit(createEvent('experiment.created', {}));
    expect(callCount).toBe(1);

    unsubscribe();

    await eventBus.emit(createEvent('experiment.created', {}));
    expect(callCount).toBe(1); // Still 1, not called again
  });

  it('should handle errors in event handlers gracefully', async () => {
    const handler1 = () => {
      throw new Error('Handler error');
    };
    let handler2Called = false;
    const handler2 = () => {
      handler2Called = true;
    };

    eventBus.subscribe('experiment.created', handler1);
    eventBus.subscribe('experiment.created', handler2);

    await eventBus.emit(createEvent('experiment.created', {}));

    expect(handler2Called).toBe(true); // Should still call other handlers
  });

  it('should create events with correct structure', () => {
    const data = { id: '123', name: 'Test' };
    const metadata = { userId: 'user1' };

    const event = createEvent('experiment.created', data, metadata);

    expect(event.type).toBe('experiment.created');
    expect(event.data).toEqual(data);
    expect(event.metadata).toEqual(metadata);
    expect(event.timestamp).toBeInstanceOf(Date);
  });
});
