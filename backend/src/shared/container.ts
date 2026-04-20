import { InMemoryDomainEventBus } from './infrastructure/events/in-memory-domain-event-bus';
import { registerDefaultDomainEventHandlers } from './infrastructure/events/default-domain-event-handlers';

const domainEventBus = new InMemoryDomainEventBus();
registerDefaultDomainEventHandlers(domainEventBus);

export { domainEventBus };
