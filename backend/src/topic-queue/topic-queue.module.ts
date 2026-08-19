import { Module } from '@nestjs/common';
import { TopicQueueController } from './topic-queue.controller';
import { TopicQueueService } from './topic-queue.service';

@Module({
  controllers: [TopicQueueController],
  providers: [TopicQueueService],
})
export class TopicQueueModule {}
