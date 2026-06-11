import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';
import { ChatService } from './chat.service';

class SendMessageDto {
  @IsOptional()
  @IsMongoId()
  conversationId?: string;

  @IsString()
  @MinLength(1)
  message!: string;
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  sendMessage(@Body() body: SendMessageDto) {
    return this.chatService.sendMessage(body);
  }

  @Get('conversations/:conversationId/messages')
  getMessages(@Param('conversationId') conversationId: string) {
    return this.chatService.getMessages(conversationId);
  }
}