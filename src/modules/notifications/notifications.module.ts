import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { DlqNotificationsController } from './dlq.consumer.controller';
import { RetryNotificationsController } from './retry.consumer.controller';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  controllers: [
    NotificationsController,
    DlqNotificationsController,
    RetryNotificationsController,
  ],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
