import { DomainEventBusPort } from '../../application/domain-event-bus.port';
import { DomainEvent, DomainEventHandler } from '../../domain/events/domain-event';
import { logger } from '../../../utils/logger';

export class InMemoryDomainEventBus implements DomainEventBusPort {
  private readonly handlers = new Map<string, DomainEventHandler[]>();

  subscribe<TEvent extends DomainEvent>(
    eventName: string,
    handler: DomainEventHandler<TEvent>,
  ): void {
    const existingHandlers = this.handlers.get(eventName) ?? [];
    existingHandlers.push(handler as DomainEventHandler);
    this.handlers.set(eventName, existingHandlers);
  }

  async publish<TEvent extends DomainEvent>(event: TEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventName) ?? [];

    logger.debug(
      {
        eventName: event.eventName,
        occurredAt: event.occurredAt.toISOString(),
        handlers: handlers.length,
      },
      'Publishing domain event',
    );

    await Promise.all(
      handlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          logger.error({ error, eventName: event.eventName }, 'Domain event handler failed');
        }
      }),
    );
  }
}
