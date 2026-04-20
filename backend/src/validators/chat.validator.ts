import { z } from 'zod';

export const sendMessageSchema = z.object({
  chatId: z.string().uuid('Invalid chat ID'),
  content: z.string().min(1, 'Message cannot be empty').max(5000),
  type: z.enum(['TEXT', 'SYSTEM', 'FILE']).optional(),
});

export const createChatSchema = z.object({
  participantIds: z.array(z.string().uuid()).min(1, 'At least one participant required'),
  name: z.string().max(100).optional(),
  type: z.enum(['DIRECT', 'GROUP']).optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateChatInput = z.infer<typeof createChatSchema>;
