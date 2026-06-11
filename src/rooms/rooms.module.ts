import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { Room, RoomSchema } from './schemas/room.schema';
import { RoomMessage, RoomMessageSchema } from './schemas/room-message.schema';
import { OpenAiModule } from '../open-ai/open-ai.module';

@Module({
  imports: [
    OpenAiModule,
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      { name: RoomMessage.name, schema: RoomMessageSchema },
    ]),
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}