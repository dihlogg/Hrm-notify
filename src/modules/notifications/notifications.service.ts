import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { InjectModel } from '@nestjs/mongoose';
import {
  NotificationDocument,
  Notifications,
} from './schemas/notifications.schema';
import { Model, Types } from 'mongoose';
import { PaginationDto } from 'src/utils/pagination/pagination.dto';
import { paginationMongo } from 'src/utils/pagination/pagination.util';

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

    const notifications = targetEmployees.map((recipient) => ({
      id: leaveRequest.id,
      type: 'LEAVE_REQUEST_CREATED',
      message: `New leave request from: ${leaveRequest.employee.lastName} ${leaveRequest.employee.firstName}`,
      payload: leaveRequest,
      actor,
      recipient,
    }));

    await this.notificationModel.insertMany(notifications);

    if (targetEmployees.length > 0) {
      this.notificationsGateway.sendToMultipleEmployees(
        targetEmployees,
        'LEAVE_REQUEST_CREATED',
      );
    }
  }

  async handleLeaveRequestUpdated(data: any) {
    const { leaveRequest, actor } = data;

    const targetEmployees = this.getTargetEmployees(
      actor.id,
      leaveRequest.employeeId,
      leaveRequest.expectedApproverId,
      leaveRequest.expectedConfirmId,
    );

    const notifications = targetEmployees.map((recipient) => ({
      id: leaveRequest.id,
      type: 'LEAVE_REQUEST_UPDATED',
      message: `${actor.lastName} ${actor.firstName} updated leave request`,
      payload: leaveRequest,
      actor,
      recipient,
    }));

    await this.notificationModel.insertMany(notifications);

    if (targetEmployees.length > 0) {
      this.notificationsGateway.sendToMultipleEmployees(
        targetEmployees,
        'LEAVE_REQUEST_UPDATED',
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

    const notifications = targetEmployees.map((recipient) => ({
      id: leaveRequest.id,
      type: 'LEAVE_REQUEST_STATUS_UPDATED',
      message: `${actor.lastName} ${actor.firstName} updated leave request status: ${previousStatus} to ${newStatus}`,
      payload: leaveRequest,
      actor,
      recipient,
      previousStatus,
      newStatus,
    }));

    await this.notificationModel.insertMany(notifications);

    if (targetEmployees.length > 0) {
      this.notificationsGateway.sendToMultipleEmployees(
        targetEmployees,
        'LEAVE_REQUEST_STATUS_UPDATED',
      );
    }
  }

  async getNotificationsByEmployeeId(id: string, pagination: PaginationDto) {
    return paginationMongo(
      this.notificationModel,
      { recipient: id },
      {
        page: pagination.page,
        pageSize: pagination.pageSize,
        sort: { createdAt: -1 },
      },
    );
  }

  async getUnSeenCountByRecipientId(id: string): Promise<number> {
    return this.notificationModel.countDocuments({
      recipient: id,
      seen: false,
    });
  }
  async markAllAsSeenByRecipientId(id: string): Promise<boolean> {
    const result = await this.notificationModel.updateMany(
      { recipient: id, seen: false },
      { $set: { seen: true } },
    );
    return result.matchedCount > 0;
  }
  async getUnReadCountByRecipientId(id: string): Promise<number> {
    return this.notificationModel.countDocuments({
      recipient: id,
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
