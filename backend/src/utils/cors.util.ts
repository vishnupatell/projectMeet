import { config } from '../config';

const LOCALHOST_ORIGIN_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export const isCorsOriginAllowed = (origin?: string): boolean => {
  // Non-browser clients (no Origin header) should still be allowed.
  if (!origin) return true;

  if (config.cors.origin.includes(origin)) {
    return true;
  }

  // In development, allow localhost/127.0.0.1 on any port.
  if (config.isDev && LOCALHOST_ORIGIN_REGEX.test(origin)) {
    return true;
  }

  return false;
};
