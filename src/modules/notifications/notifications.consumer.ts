import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  KafkaContext,
  MessagePattern,
  Payload,
} from '@nestjs/microservices';
import { DlqService } from 'src/kafka/dlq/dlq-handler.service';
import { KAFKA_TOPICS } from 'src/kafka/config/kafka-topics.constant';
import { retry } from 'src/utils/retry';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsConsumer {
  private readonly logger = new Logger(NotificationsConsumer.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly dlqService: DlqService,
  ) {}

  @MessagePattern(KAFKA_TOPICS.LEAVE_REQUEST_CREATED)
  async onLeaveRequestCreated(
    @Payload() data: any,
    @Ctx() context: KafkaContext,
  ) {
    const message = context.getMessage();
    try {
      this.logger.log('Received LEAVE_REQUEST_CREATED message');
      await retry(
        () => this.notificationsService.handleLeaveRequestCreated(data),
        {
          retries: 3,
          initialDelay: 1000,
        },
      );
    } catch (error) {
      this.logger.error(
        'Failed to process LEAVE_REQUEST_CREATED. Sending to DLQ.',
      );
      await this.dlqService.sendToDlq([message], context.getTopic(), error);
    }
  }

  @MessagePattern(KAFKA_TOPICS.LEAVE_REQUEST_UPDATED)
  async onLeaveRequestUpdated(
    @Payload() data: any,
    @Ctx() context: KafkaContext,
  ) {
    const message = context.getMessage();
    try {
      this.logger.log('Received LEAVE_REQUEST_UPDATED message');
      await retry(
        () => this.notificationsService.handleLeaveRequestUpdated(data),
        {
          retries: 3,
          initialDelay: 1000,
        },
      );
    } catch (error) {
      this.logger.error(
        'Failed to process LEAVE_REQUEST_UPDATED. Sending to DLQ.',
      );
      await this.dlqService.sendToDlq([message], context.getTopic(), error);
    }
  }

  @MessagePattern(KAFKA_TOPICS.LEAVE_REQUEST_STATUS_UPDATED)
  async onLeaveRequestUpdateStatus(
    @Payload() data: any,
    @Ctx() context: KafkaContext,
  ) {
    const message = context.getMessage();
    try {
      this.logger.log('Received LEAVE_REQUEST_UPDATE_STATUS message');
      await retry(
        () => this.notificationsService.handleLeaveRequestStatusUpdated(data),
        {
          retries: 3,
          initialDelay: 1000,
        },
      );
    } catch (error) {
      this.logger.error(
        'Failed to process LEAVE_REQUEST_UPDATE_STATUS. Sending to DLQ.',
      );
      await this.dlqService.sendToDlq([message], context.getTopic(), error);
    }
  }

  @MessagePattern(KAFKA_TOPICS.USER_MENTIONED)
  async onUserMentioned(@Payload() payload: any, @Ctx() context: KafkaContext) {
    const message = context.getMessage();
    try {
      this.logger.log('Received USER_MENTIONED message');

      const actualData = payload.data ? payload.data : payload;

      await retry(
        () => this.notificationsService.handleUserMentioned(actualData),
        {
          retries: 3,
          initialDelay: 1000,
        },
      );
    } catch (error) {
      this.logger.error('Failed to process USER_MENTIONED. Sending to DLQ.');
      await this.dlqService.sendToDlq([message], context.getTopic(), error);
    }
  }
}
