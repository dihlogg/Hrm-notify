import { RmqContext } from '@nestjs/microservices';
import { Channel, ConsumeMessage } from 'amqplib';

export async function handleEventWithRetry({
  context,
  data,
  handler,
  retryQueue,
  dlqQueue,
  maxRetry = 3,
  retryDelayMs = 5000,
}: {
  context: RmqContext;
  data: any;
  handler: (data: any) => Promise<void>;
  retryQueue: string;
  dlqQueue: string;
  maxRetry?: number;
  retryDelayMs?: number;
}) {
  const channel: Channel = context.getChannelRef();
  const msg: ConsumeMessage = context.getMessage();
  const headers = msg.properties.headers || {};
  const retryCount = headers['x-retry-count'] || 0;

  try {
    // Xử lý business logic
    await handler(data);

    // Thành công → ack
    channel.ack(msg);
  } catch (error) {
    console.error(`Handler failed: ${error.message}`);

    if (retryCount < maxRetry) {
      // Retry: ack msg gốc + gửi sang retry queue
      channel.ack(msg);
      channel.sendToQueue(retryQueue, Buffer.from(JSON.stringify(data)), {
        headers: { 'x-retry-count': retryCount + 1 },
        expiration: retryDelayMs.toString(),
      });
    } else {
      // Max retry: ack msg gốc + gửi sang DLQ
      channel.ack(msg);
      channel.sendToQueue(dlqQueue, Buffer.from(JSON.stringify(data)), {
        headers: { 'x-retry-count': retryCount },
      });
    }
  }
}
