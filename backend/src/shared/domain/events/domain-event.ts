export interface DomainEvent<TPayload extends object = object> {
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly payload: TPayload;
}

export type DomainEventHandler<TEvent extends DomainEvent = DomainEvent> = (
  event: TEvent,
) => Promise<void> | void;
