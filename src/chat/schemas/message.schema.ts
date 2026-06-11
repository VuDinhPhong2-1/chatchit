import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId!: Types.ObjectId;

  @Prop({ enum: ['user', 'assistant', 'system'], required: true })
  role!: 'user' | 'assistant' | 'system';

  @Prop({ required: true })
  content!: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);