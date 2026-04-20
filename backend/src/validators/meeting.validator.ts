import { z } from 'zod';

const DATETIME_LOCAL_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const scheduledAtSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;

    const trimmedValue = value.trim();
    if (!trimmedValue) return undefined;

    const normalizedValue = DATETIME_LOCAL_REGEX.test(trimmedValue)
      ? `${trimmedValue}:00`
      : trimmedValue;
    const parsedDate = new Date(normalizedValue);

    if (Number.isNaN(parsedDate.getTime())) return value;
    return parsedDate;
  },
  z.date({ invalid_type_error: 'Invalid datetime' }).optional(),
);

export const createMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  scheduledAt: scheduledAtSchema,
  maxParticipants: z.number().int().min(2).max(500).optional(),
});

export const joinMeetingSchema = z.object({
  code: z.string().min(1, 'Meeting code is required'),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type JoinMeetingInput = z.infer<typeof joinMeetingSchema>;
