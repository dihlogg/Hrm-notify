import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { InjectModel } from '@nestjs/mongoose';
import {
  NotificationDocument,
  Notifications,
} from './schemas/notifications.schema';
import { Model, Types } from 'mongoose';

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
    const { leaveRequest, actor, previousStatus, newStatus } = data;

    const targetEmployees = this.getTargetEmployees(
      actor.id,
      leaveRequest.employeeId,
      leaveRequest.expectedApproverId,
      leaveRequest.expectedConfirmId,
    );

    const notification = new this.notificationModel({
      id: leaveRequest.id,
      type: 'LEAVE_REQUEST_UPDATED',
      message: `${actor.lastName} ${actor.firstName} updated leave request status: ${previousStatus} to ${newStatus}`,
      payload: leaveRequest,
      actor,
      recipients: targetEmployees,
      previousStatus,
      newStatus,
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

  async getUnSeenCountByActorId(id: string): Promise<number> {
    return this.notificationModel.countDocuments({
      'actor.id': id,
      seen: false,
    });
  }
  async markAllAsSeenByActorId(id: string): Promise<boolean> {
    const result = await this.notificationModel.updateMany(
      { 'actor.id': id, seen: false },
      { $set: { seen: true } },
    );
    return result.matchedCount > 0;
  }
  async getUnReadCountByActorId(id: string): Promise<number> {
    return this.notificationModel.countDocuments({
      'actor.id': id,
      read: false,
    });
  }
  async markAsRead(_id: string): Promise<boolean> {
    const result = await this.notificationModel.updateOne(
      { _id: new Types.ObjectId(_id) },
      { $set: { read: true } },
    );
    return result.modifiedCount > 0;
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
