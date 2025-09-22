import { Controller } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { handleEventWithRetry } from 'src/helper/rmq-helper';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('LEAVE_REQUEST_CREATED')
  async onLeaveRequestCreated(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    console.log(
      `[${new Date().toISOString()}] Received message on LEAVE_REQUEST_CREATED:`,
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
    } catch (error) {
      console.error(error.message || 'failed to receive message from broker');
    }
  }
}
