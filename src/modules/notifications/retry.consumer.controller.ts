import { Controller } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { handleEventWithRetry } from 'src/helper/rmq-helper';

@Controller('retry-notifications')
export class RetryNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('LEAVE_REQUEST_RETRY')
  async onLeaveRequestRetry(@Payload() data: any, @Ctx() context: RmqContext) {
    const headers = context.getMessage().properties.headers || {};
    console.log(
      `[${new Date().toISOString()}] Received message on LEAVE_REQUEST_RETRY:`,
      {
        queue: 'leave_request_retry_queue',
        data,
        retryCount: headers['x-retry-count'] || 0,
        headers,
      },
    );

    try {
      await handleEventWithRetry({
        context,
        data,
        handler: this.notificationsService.handleLeaveRequestCreated.bind(
          this.notificationsService,
        ),
        retryQueue: 'leave_request_retry_queue',
        dlqQueue: 'leave_request_dlq',
      });
      console.log(
        `[${new Date().toISOString()}] Successfully processed LEAVE_REQUEST_RETRY:`,
        {
          data,
          retryCount: headers['x-retry-count'] || 0,
        },
      );
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Error processing LEAVE_REQUEST_RETRY:`,
        {
          data,
          retryCount: headers['x-retry-count'] || 0,
          error: error.message,
        },
      );
    }
  }
}
