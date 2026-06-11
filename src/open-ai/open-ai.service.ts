import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

type ChatRole = 'system' | 'user' | 'assistant';

@Injectable()
export class OpenAiService {
  private readonly client: OpenAI;

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.config.getOrThrow<string>('OPENAI_API_KEY'),
    });
  }

  async generateReply(messages: { role: ChatRole; content: string }[]) {
    const model = this.config.get<string>('OPENAI_MODEL') || 'gpt-4.1-mini';

    const response = await this.client.responses.create({
      model,
      input: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });

    return response.output_text;
  }
}