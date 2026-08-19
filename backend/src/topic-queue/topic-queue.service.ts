import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateTopicDto } from './dto/create-topic.dto';

@Injectable()
export class TopicQueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(userId: string, dto: CreateTopicDto) {
    const topic = await this.prisma.topicQueue.create({
      data: { topic: dto.topic, context: dto.context },
    });
    await this.auditLog.record(userId, 'topic_queue', topic.id, 'CREATE', {
      ...dto,
    });
    return topic;
  }
}
