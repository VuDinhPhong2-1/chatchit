import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OpenAiService } from '../open-ai/open-ai.service';
import { Room } from './schemas/room.schema';
import { RoomMessage } from './schemas/room-message.schema';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name)
    private readonly roomModel: Model<Room>,

    @InjectModel(RoomMessage.name)
    private readonly roomMessageModel: Model<RoomMessage>,

    private readonly openAiService: OpenAiService,
  ) {}

  async createRoom(input: {
    name: string;
    type?: 'private' | 'group';
    enableAi?: boolean;
    participants: {
      userId: string;
      displayName: string;
      role: 'human' | 'ai';
    }[];
  }) {
    const hasAi = input.participants.some((p) => p.role === 'ai');

    const room = await this.roomModel.create({
      name: input.name,
      type: input.type || 'group',
      enableAi: input.enableAi ?? hasAi,
      participants: hasAi
        ? input.participants
        : [
            ...input.participants,
            {
              userId: 'ai-assistant',
              displayName: 'AI Assistant',
              role: 'ai',
            },
          ],
    });

    return room;
  }

  async getMessages(roomId: string) {
    return this.roomMessageModel
      .find({ roomId: new Types.ObjectId(roomId) })
      .sort({ createdAt: 1 })
      .lean();
  }

  async sendMessage(
    roomId: string,
    input: {
      senderId: string;
      senderName: string;
      content: string;
      askAi?: boolean;
    },
  ) {
    const room = await this.roomModel.findById(roomId).lean();

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const roomObjectId = new Types.ObjectId(roomId);

    const userMessage = await this.roomMessageModel.create({
      roomId: roomObjectId,
      senderType: 'human',
      senderId: input.senderId,
      senderName: input.senderName,
      content: input.content,
    });

    const shouldAskAi = room.enableAi && input.askAi !== false;

    if (!shouldAskAi) {
      return {
        roomId,
        messages: [userMessage],
        aiReply: null,
      };
    }

    const recentMessages = await this.roomMessageModel
      .find({ roomId: roomObjectId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const orderedMessages = recentMessages.reverse();

    const participantsText = room.participants
      .map((p) => `- ${p.displayName} (${p.role})`)
      .join('\n');

    const chatHistoryText = orderedMessages
      .map((message) => `${message.senderName}: ${message.content}`)
      .join('\n');

    const systemPrompt = `
Bạn là AI Assistant đang tham gia một phòng chat nhóm.

Thông tin phòng:
Tên phòng: ${room.name}
Loại phòng: ${room.type}

Thành viên:
${participantsText}

Quy tắc:
- Trả lời bằng tiếng Việt.
- Ngắn gọn, tự nhiên như đang chat trong nhóm.
- Có thể nhắc tên người gửi nếu phù hợp.
- Không bịa thông tin.
- Nếu chưa đủ thông tin, hãy hỏi lại.
- Không trả lời quá dài nếu không cần thiết.
`.trim();

    const aiReply = await this.openAiService.generateReply([
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `
Lịch sử chat gần đây:
${chatHistoryText}

Tin nhắn mới nhất từ ${input.senderName}:
${input.content}

Hãy trả lời trong nhóm.
`.trim(),
      },
    ]);

    const aiMessage = await this.roomMessageModel.create({
      roomId: roomObjectId,
      senderType: 'ai',
      senderId: 'ai-assistant',
      senderName: 'AI Assistant',
      content: aiReply,
    });

    return {
      roomId,
      messages: [userMessage, aiMessage],
      aiReply,
    };
  }
}