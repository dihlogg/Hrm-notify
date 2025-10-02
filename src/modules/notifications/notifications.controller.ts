import { Controller, Get, Param, Patch } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { handleEventWithRetry } from 'src/helper/rmq-helper';

@Controller('Notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('LEAVE_REQUEST_CREATED')
  async onLeaveRequestCreated(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    await handleEventWithRetry({
      context,
      data,
      handler: this.notificationsService.handleLeaveRequestCreated.bind(
        this.notificationsService,
      ),
      retryQueue: 'leave_request_retry_queue',
      dlqQueue: 'leave_request_dlq',
    });
  }

  @EventPattern('LEAVE_REQUEST_UPDATED')
  async onLeaveRequestStatusUpdated(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    await handleEventWithRetry({
      context,
      data,
      handler: this.notificationsService.handleLeaveRequestStatusUpdated.bind(
        this.notificationsService,
      ),
      retryQueue: 'leave_request_retry_queue',
      dlqQueue: 'leave_request_dlq',
    });
  }

  @Get('GetNotificationsByEmployeeId/:id')
  async getNotificationsByEmployeeId(@Param('id') id: string) {
    return this.notificationsService.getNotificationsByEmployeeId(id);
  }

  @Get('GetUnSeenCountByActorId/:id')
  async getUnSeenCountByActorId(@Param('id') id: string) {
    return this.notificationsService.getUnSeenCountByActorId(id);
  }

  @Patch('MarkAllAsSeenByActorId/:id')
  async markAllAsSeenByActorId(@Param('id') id: string) {
    return this.notificationsService.markAllAsSeenByActorId(id);
  }

  @Get('GetUnReadCountByActorId/:id')
  async getUnReadCountByActorId(@Param('id') id: string) {
    return this.notificationsService.getUnReadCountByActorId(id);
  }

  @Patch('MarkAsRead/:id')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }
}
