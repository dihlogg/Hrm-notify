import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { handleEventWithRetry } from 'src/helper/rmq-helper';
import { PaginationDto } from 'src/utils/pagination/pagination.dto';

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
  async onLeaveRequestUpdated(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    await handleEventWithRetry({
      context,
      data,
      handler: this.notificationsService.handleLeaveRequestUpdated.bind(
        this.notificationsService,
      ),
      retryQueue: 'leave_request_retry_queue',
      dlqQueue: 'leave_request_dlq',
    });
  }

  @EventPattern('LEAVE_REQUEST_STATUS_UPDATED')
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
  async getNotificationsByEmployeeId(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.notificationsService.getNotificationsByEmployeeId(
      id,
      pagination,
    );
  }

  @Get('GetUnSeenCountByRecipientId/:id')
  async getUnSeenCountByRecipientId(@Param('id') id: string) {
    return this.notificationsService.getUnSeenCountByRecipientId(id);
  }

  @Patch('MarkAllAsSeenByRecipientId/:id')
  async markAllAsSeenByRecipientId(@Param('id') id: string) {
    return this.notificationsService.markAllAsSeenByRecipientId(id);
  }

  @Get('GetUnReadCountByRecipientId/:id')
  async getUnReadCountByRecipientId(@Param('id') id: string) {
    return this.notificationsService.getUnReadCountByRecipientId(id);
  }

  @Patch('MarkAsRead/:id')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }
}
