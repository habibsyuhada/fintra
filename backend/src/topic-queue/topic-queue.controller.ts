import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { TopicQueueService } from './topic-queue.service';
import { CreateTopicDto } from './dto/create-topic.dto';

@UseGuards(JwtAccessGuard)
@Controller('topics')
export class TopicQueueController {
  constructor(private readonly topicQueueService: TopicQueueService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateTopicDto) {
    return this.topicQueueService.create(user.userId, dto);
  }
}
