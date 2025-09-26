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

    const expectedApproverId = data.expectedApproverId;
    const expectedConfirmId = data.expectedConfirmId;
    const targetEmployees: string[] = [];
    if (expectedApproverId) {
      targetEmployees.push(expectedApproverId.toString());
    }
    if (expectedConfirmId) {
      targetEmployees.push(expectedConfirmId.toString());
    }
    // Push sang websocket
    if (targetEmployees.length > 0) {
      this.notificationsGateway.sendToMultipleEmployees(
        targetEmployees,
        'LEAVE_REQUEST_CREATED',
        data,
      );
    }
  }
  async logFailedMessage(data: any, headers?: any): Promise<void> {
    console.error('Failed message:', { data, headers });
  }

  async getNotificationsByEmployeeId(id: string): Promise<Notifications[]> {
    return this.notificationModel
      .find({ 'payload.employeeId': id })
      .sort({ createAt: -1 })
      .exec();
  }
  async getLeaveRequestNotiWithConfirmId(id: string): Promise<Notifications[]> {
    return this.notificationModel
      .find({ 'payload.expectedConfirmId': id })
      .sort({ createAt: -1 })
      .exec();
  }
  async getLeaveRequestNotiWithApproveId(id: string): Promise<Notifications[]> {
    return this.notificationModel
      .find({ 'payload.expectedApproverId': id })
      .sort({ createAt: -1 })
      .exec();
  }
}
