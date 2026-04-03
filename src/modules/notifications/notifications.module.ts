import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Notifications,
  NotificationSchema,
} from './schemas/notifications.schema';
import { NotificationsConsumer } from './notifications.consumer';
import { KafkaModule } from '../../kafka/kafka.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notifications.name, schema: NotificationSchema },
    ]),
    KafkaModule,
  ],
  controllers: [NotificationsController, NotificationsConsumer],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
