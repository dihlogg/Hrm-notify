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

  @Prop({ type: [String], required: true })
  recipients: string[]; // danh sách employee nhận notify
}

export const NotificationSchema = SchemaFactory.createForClass(Notifications);

NotificationSchema.index({ id: 1 }, { unique: true });
