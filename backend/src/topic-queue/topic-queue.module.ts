import { Module } from '@nestjs/common';
import { TopicQueueController } from './topic-queue.controller';
import { TopicQueueInternalController } from './topic-queue-internal.controller';
import { TopicQueueService } from './topic-queue.service';

@Module({
  controllers: [TopicQueueController, TopicQueueInternalController],
  providers: [TopicQueueService],
})
export class TopicQueueModule {}
