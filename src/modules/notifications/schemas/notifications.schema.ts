import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notifications & Document;

@Schema({ timestamps: true })
export class Notifications {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object })
  payload: any;

  @Prop({ default: false })
  read: boolean;

  @Prop({ default: false })
  seen: boolean;

  @Prop({ type: Object })
  actor: any;

  @Prop({ required: true })
  recipient: string; // employee nhận notify

  @Prop()
  previousStatus: string;

  @Prop()
  newStatus: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notifications);

