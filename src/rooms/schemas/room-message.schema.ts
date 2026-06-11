import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RoomMessageDocument = HydratedDocument<RoomMessage>;

@Schema({ timestamps: true })
export class RoomMessage {
  @Prop({ type: Types.ObjectId, ref: 'Room', required: true })
  roomId!: Types.ObjectId;

  @Prop({ enum: ['human', 'ai'], required: true })
  senderType!: 'human' | 'ai';

  @Prop({ required: true })
  senderId!: string;

  @Prop({ required: true })
  senderName!: string;

  @Prop({ required: true })
  content!: string;
}

export const RoomMessageSchema = SchemaFactory.createForClass(RoomMessage);