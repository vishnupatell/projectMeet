import { DomainEventBusPort } from '../../application/domain-event-bus.port';
import { logger } from '../../../utils/logger';

const TRACKED_EVENTS = [
  'auth.user.registered',
  'auth.user.logged_in',
  'auth.user.logged_out',
  'auth.user.logged_out_all',
  'chat.created',
  'chat.message.sent',
  'meeting.created',
  'meeting.joined',
  'meeting.left',
  'meeting.ended',
] as const;

export function registerDefaultDomainEventHandlers(eventBus: DomainEventBusPort): void {
  TRACKED_EVENTS.forEach((eventName) => {
    eventBus.subscribe(eventName, (event) => {
      logger.info(
        {
          eventName: event.eventName,
          payload: event.payload,
          occurredAt: event.occurredAt.toISOString(),
        },
        'Domain event handled',
      );
    });
  });
}
