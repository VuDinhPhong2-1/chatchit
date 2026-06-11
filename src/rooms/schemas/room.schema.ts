import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RoomDocument = HydratedDocument<Room>;

export type RoomType = 'private' | 'group';

@Schema({ timestamps: true })
export class Room {
  @Prop({ required: true })
  name!: string;

  @Prop({ enum: ['private', 'group'], default: 'group' })
  type!: RoomType;

  @Prop({
    type: [
      {
        userId: String,
        displayName: String,
        role: String,
      },
    ],
    default: [],
  })
  participants!: {
    userId: string;
    displayName: string;
    role: 'human' | 'ai';
  }[];

  @Prop({ default: true })
  enableAi!: boolean;
}

export const RoomSchema = SchemaFactory.createForClass(Room);