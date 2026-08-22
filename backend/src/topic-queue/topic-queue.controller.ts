import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { TopicQueueService } from './topic-queue.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { QueryTopicDto } from './dto/query-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

@UseGuards(JwtAccessGuard)
@Controller('topics')
export class TopicQueueController {
  constructor(private readonly topicQueueService: TopicQueueService) {}

  @Get()
  findAll(@Query() query: QueryTopicDto) {
    return this.topicQueueService.findAll(query);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateTopicDto) {
    return this.topicQueueService.create(user.userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateTopicDto,
  ) {
    return this.topicQueueService.markDone(user.userId, id, dto.done);
  }
}
