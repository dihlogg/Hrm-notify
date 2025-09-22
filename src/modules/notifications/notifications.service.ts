import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsGateway: NotificationsGateway) {}
  async handleLeaveRequestCreated(data: any) {
    //push sang websocket
    this.notificationsGateway.sendBroadcast('LEAVE_REQUEST_CREATED', data);
  }
  async logFailedMessage(data: any, headers?: any): Promise<void> {
    console.error('Failed message:', { data, headers });
  }
}
