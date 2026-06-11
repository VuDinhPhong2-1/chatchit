import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { RoomsService } from './rooms.service';
import { CloudinaryService } from './cloudinary.service';

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
type UploadedImageFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};
class SendRoomMessageDto {
  @IsString()
  senderId!: string;

  @IsString()
  senderName!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsIn(['text', 'image'])
  messageType?: 'text' | 'image';

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  askAi?: boolean;
}

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  @Post()
  createRoom(@Body() body: CreateRoomDto) {
    return this.roomsService.createRoom(body);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new Error('Only image files are allowed'), false);
          return;
        }

        callback(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: UploadedImageFile) {
    const result = await this.cloudinaryService.uploadImage(file);

    return {
      imageUrl: result.url,
      publicId: result.publicId,
    };
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
    return this.roomsService.sendMessage(roomId, {
      ...body,
      content: body.content || '',
    });
  }
}