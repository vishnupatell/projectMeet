import { chatRepository } from '../repositories/chat.repository';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { SendMessageInput, CreateChatInput } from '../validators/chat.validator';
import { logger } from '../utils/logger';

export class ChatService {
  async createChat(input: CreateChatInput, userId: string) {
    const allMemberIds = [...new Set([userId, ...input.participantIds])];

    const chat = await chatRepository.create({
      type: input.type || (allMemberIds.length === 2 ? 'DIRECT' : 'GROUP'),
      name: input.name,
      members: {
        create: allMemberIds.map((id) => ({
          user: { connect: { id } },
        })),
      },
    });

    logger.info({ chatId: chat.id }, 'Chat created');
    return chat;
  }

  async sendMessage(input: SendMessageInput, senderId: string) {
    const chat = await chatRepository.findById(input.chatId);
    if (!chat) {
      throw new NotFoundError('Chat');
    }

    const isMember = chat.members.some((m) => m.userId === senderId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this chat');
    }

    const message = await chatRepository.createMessage({
      chat: { connect: { id: input.chatId } },
      sender: { connect: { id: senderId } },
      content: input.content,
      type: input.type || 'TEXT',
    });

    return message;
  }

  async getMessages(chatId: string, userId: string, cursor?: string, limit?: number) {
    const chat = await chatRepository.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat');
    }

    const isMember = chat.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this chat');
    }

    return chatRepository.getMessages(chatId, cursor, limit);
  }

  async getUserChats(userId: string) {
    return chatRepository.getUserChats(userId);
  }

  async getChatById(chatId: string) {
    const chat = await chatRepository.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat');
    }
    return chat;
  }
}

export const chatService = new ChatService();
