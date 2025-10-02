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
    const { leaveRequest, actor } = data;

    const targetEmployees = this.getTargetEmployees(
      actor.id,
      leaveRequest.employeeId,
      leaveRequest.expectedApproverId,
      leaveRequest.expectedConfirmId,
    );

    const notification = new this.notificationModel({
      id: leaveRequest.id,
      type: 'LEAVE_REQUEST_CREATED',
      message: `New leave request from: ${leaveRequest.employee.lastName} ${leaveRequest.employee.firstName}`,
      payload: leaveRequest,
      actor: actor,
      recipients: targetEmployees,
    });

    await notification.save();

    if (targetEmployees.length > 0) {
      this.notificationsGateway.sendToMultipleEmployees(
        targetEmployees,
        'LEAVE_REQUEST_CREATED',
      );
    }
  }

  async handleLeaveRequestStatusUpdated(data: any) {
    const { leaveRequest, actor } = data;

    const targetEmployees = this.getTargetEmployees(
      actor.id,
      leaveRequest.employeeId,
      leaveRequest.expectedApproverId,
      leaveRequest.expectedConfirmId,
    );

    const notification = new this.notificationModel({
      id: leaveRequest.id,
      type: 'LEAVE_REQUEST_UPDATED',
      message: `Leave request status updated by: ${actor.lastName} ${actor.firstName}`,
      payload: leaveRequest,
      actor,
      recipients: targetEmployees,
    });
    await notification.save();

    if (targetEmployees.length > 0) {
      this.notificationsGateway.sendToMultipleEmployees(
        targetEmployees,
        'LEAVE_REQUEST_UPDATED',
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

  //actorId: user action (create, confirm, approve)
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
