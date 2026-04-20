import { DomainEvent, DomainEventHandler } from '../domain/events/domain-event';

export interface DomainEventBusPort {
  publish<TEvent extends DomainEvent>(event: TEvent): Promise<void>;
  subscribe<TEvent extends DomainEvent>(
    eventName: string,
    handler: DomainEventHandler<TEvent>,
  ): void;
}
