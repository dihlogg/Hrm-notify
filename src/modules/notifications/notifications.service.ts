import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { InjectModel } from '@nestjs/mongoose';
import {
  NotificationDocument,
  Notifications,
} from './schemas/notifications.schema';
import { Model } from 'mongoose';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notifications.name)
    private notificationModel: Model<NotificationDocument>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}
  async handleLeaveRequestCreated(data: any) {
    const notification = new this.notificationModel({
      id: data.id,
      type: 'LEAVE_REQUEST_CREATED',
      message: `New leave request from: ${data.employee.lastName} ${data.employee.firstName}`,
      payload: data,
      read: false,
    });
    await notification.save();
    //push sang websocket
    this.notificationsGateway.sendBroadcast('LEAVE_REQUEST_CREATED', data);
  }
  async logFailedMessage(data: any, headers?: any): Promise<void> {
    console.error('Failed message:', { data, headers });
  }
}
