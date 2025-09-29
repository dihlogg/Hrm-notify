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
    const targetEmployees = this.getTargetEmployees(
      data.employeeId,
      data.employeeId,
      data.expectedApproverId,
      data.expectedConfirmId,
    );

    const notification = new this.notificationModel({
      id: data.id,
      type: 'LEAVE_REQUEST_CREATED',
      message: `New leave request from: ${data.employee.lastName} ${data.employee.firstName}`,
      payload: data,
      recipients: targetEmployees,
      readBy: [],
    });
    await notification.save();

    if (targetEmployees.length > 0) {
      this.notificationsGateway.sendToMultipleEmployees(
        targetEmployees,
        'LEAVE_REQUEST_CREATED',
        data,
      );
    }
  }

  async handleLeaveRequestStatusUpdated(data: any) {
    const targetEmployees = this.getTargetEmployees(
      data.actorId,
      data.employeeId,
      data.expectedApproverId,
      data.expectedConfirmId,
    );

    const notification = new this.notificationModel({
      id: data.id,
      type: 'LEAVE_REQUEST_STATUS_UPDATED',
      message: `Leave request status updated by: ${data.actorName}`,
      payload: data,
      recipients: targetEmployees,
      readBy: [],
    });
    await notification.save();

    if (targetEmployees.length > 0) {
      this.notificationsGateway.sendToMultipleEmployees(
        targetEmployees,
        'LEAVE_REQUEST_STATUS_UPDATED',
        data,
      );
    }
  }

  async getNotificationsByEmployeeId(id: string): Promise<Notifications[]> {
    return this.notificationModel
      .find({ recipients: id })
      .sort({ createdAt: -1 })
      .exec();
  }
  async markAsRead(notificationId: string, employeeId: string): Promise<void> {
    await this.notificationModel.findByIdAndUpdate(notificationId, {
      $addToSet: { readBy: employeeId },
    });
  }

  // Log failed message từ queue/consumer
  async logFailedMessage(data: any, headers?: any): Promise<void> {
    console.error('Failed message:', { data, headers });
  }

  //actorId: ai vừa thực hiện action (tạo, confirm, approve)
  private getTargetEmployees(
    actorId: string,
    employeeId: string,
    approverId?: string,
    confirmId?: string,
  ): string[] {
    const targets: string[] = [];
    if (employeeId && employeeId !== actorId) {
      targets.push(employeeId);
    }
    if (approverId && approverId !== actorId) {
      targets.push(approverId);
    }
    if (confirmId && confirmId !== actorId) {
      targets.push(confirmId);
    }
    
    return targets;
  }
}
