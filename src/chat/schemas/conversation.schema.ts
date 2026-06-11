import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ default: 'website' })
  channel!: string;

  @Prop({ enum: ['bot', 'need_human', 'closed'], default: 'bot' })
  status!: string;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);