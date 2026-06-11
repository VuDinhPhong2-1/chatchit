import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsArray, IsBoolean, IsIn, IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';
import { RoomsService } from './rooms.service';

class CreateRoomDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsIn(['private', 'group'])
  type?: 'private' | 'group';

  @IsOptional()
  @IsBoolean()
  enableAi?: boolean;

  @IsArray()
  participants!: {
    userId: string;
    displayName: string;
    role: 'human' | 'ai';
  }[];
}

class SendRoomMessageDto {
  @IsString()
  senderId!: string;

  @IsString()
  senderName!: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsBoolean()
  askAi?: boolean;
}

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  createRoom(@Body() body: CreateRoomDto) {
    return this.roomsService.createRoom(body);
  }

  @Get(':roomId/messages')
  getMessages(@Param('roomId') roomId: string) {
    return this.roomsService.getMessages(roomId);
  }

  @Post(':roomId/messages')
  sendMessage(
    @Param('roomId') roomId: string,
    @Body() body: SendRoomMessageDto,
  ) {
    return this.roomsService.sendMessage(roomId, body);
  }
}