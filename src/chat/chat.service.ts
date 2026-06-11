import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OpenAiService } from '../open-ai/open-ai.service';
import { Conversation } from './schemas/conversation.schema';
import { Message } from './schemas/message.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,

    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,

    private readonly openAiService: OpenAiService,
  ) {}

  async sendMessage(input: { conversationId?: string; message: string }) {
    let conversationId = input.conversationId;

    if (!conversationId) {
      const conversation = await this.conversationModel.create({
        channel: 'website',
        status: 'bot',
      });

      conversationId = conversation._id.toString();
    }

    const conversationObjectId = new Types.ObjectId(conversationId);

    await this.messageModel.create({
      conversationId: conversationObjectId,
      role: 'user',
      content: input.message,
    });

    const recentMessages = await this.messageModel
      .find({ conversationId: conversationObjectId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const orderedMessages = recentMessages.reverse();

    const systemPrompt = `
Bạn là nhân viên tư vấn bán hàng trên website.

Quy tắc:
- Trả lời bằng tiếng Việt.
- Thân thiện, ngắn gọn, rõ ràng.
- Không bịa giá, khuyến mãi, tồn kho, bảo hành.
- Nếu chưa có đủ thông tin, hãy hỏi thêm khách.
- Nếu khách muốn mua, hãy xin số điện thoại hoặc thông tin liên hệ.
- Nếu khách khiếu nại, tức giận, yêu cầu hoàn tiền, hãy báo sẽ chuyển nhân viên hỗ trợ.
- Luôn cố gắng kết thúc bằng 1 câu hỏi để tiếp tục tư vấn.
`.trim();

    const aiReply = await this.openAiService.generateReply([
      {
        role: 'system',
        content: systemPrompt,
      },
      ...orderedMessages.map((message) => ({
        role: message.role as 'user' | 'assistant',
        content: message.content,
      })),
    ]);

    await this.messageModel.create({
      conversationId: conversationObjectId,
      role: 'assistant',
      content: aiReply,
    });

    return {
      conversationId,
      reply: aiReply,
    };
  }

  async getMessages(conversationId: string) {
    return this.messageModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .lean();
  }
}