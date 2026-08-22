import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InternalApiKeyGuard } from '../auth/guards/internal-api-key.guard';
import { TopicQueueService } from './topic-queue.service';
import { QueryPendingTopicDto } from './dto/query-pending-topic.dto';

/** Separate controller (own guard) from TopicQueueController, which requires
 * a user JWT — this lets the daily article-generator Routine read the topic
 * queue the same way it writes articles: no human is logged in when it fires. */
@UseGuards(InternalApiKeyGuard)
@Controller('topics/internal')
export class TopicQueueInternalController {
  constructor(private readonly topicQueueService: TopicQueueService) {}

  @Get()
  findPending(@Query() query: QueryPendingTopicDto) {
    return this.topicQueueService.findPendingForGenerator(query.limit);
  }
}
