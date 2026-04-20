import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { SessionDeviceMeta } from '../domain/auth.types';

export interface UserRegisteredPayload {
  userId: string;
  email: string;
}

export interface UserLoggedInPayload {
  userId: string;
  email: string;
  device: SessionDeviceMeta;
}

export interface UserLoggedOutPayload {
  refreshToken: string;
}

export interface UserLoggedOutAllPayload {
  userId: string;
}

const now = () => new Date();

export function userRegisteredEvent(payload: UserRegisteredPayload): DomainEvent<UserRegisteredPayload> {
  return {
    eventName: 'auth.user.registered',
    occurredAt: now(),
    payload,
  };
}

export function userLoggedInEvent(payload: UserLoggedInPayload): DomainEvent<UserLoggedInPayload> {
  return {
    eventName: 'auth.user.logged_in',
    occurredAt: now(),
    payload,
  };
}

export function userLoggedOutEvent(payload: UserLoggedOutPayload): DomainEvent<UserLoggedOutPayload> {
  return {
    eventName: 'auth.user.logged_out',
    occurredAt: now(),
    payload,
  };
}

export function userLoggedOutAllEvent(payload: UserLoggedOutAllPayload): DomainEvent<UserLoggedOutAllPayload> {
  return {
    eventName: 'auth.user.logged_out_all',
    occurredAt: now(),
    payload,
  };
}
