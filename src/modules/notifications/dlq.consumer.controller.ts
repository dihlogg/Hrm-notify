import { Controller } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

@Controller('dlq-notifications')
export class DlqNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('LEAVE_REQUEST_DLQ')
  async onLeaveRequestDeadLetter(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const headers = originalMsg.properties.headers || {};

    console.log(
      `[${new Date().toISOString()}] Received message on LEAVE_REQUEST_DLQ:`,
      {
        queue: 'leave_request_dlq',
        data,
        retryCount: headers['x-retry-count'] || 0,
        headers,
      },
    );

    try {
      await this.notificationsService.logFailedMessage(data);
      console.log(
        `[${new Date().toISOString()}] Successfully logged LEAVE_REQUEST_DLQ:`,
        {
          data,
          retryCount: headers['x-retry-count'] || 0,
        },
      );
      channel.ack(originalMsg);
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Error logging LEAVE_REQUEST_DLQ:`,
        {
          data,
          retryCount: headers['x-retry-count'] || 0,
          error: error.message,
        },
      );
      channel.ack(originalMsg);
    }
  }
}
