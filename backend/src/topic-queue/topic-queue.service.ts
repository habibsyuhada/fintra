import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { QueryTopicDto } from './dto/query-topic.dto';

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

  async findAll(query: QueryTopicDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const status = query.status ?? 'pending';

    const where =
      status === 'all'
        ? {}
        : status === 'used'
          ? { usedAt: { not: null } }
          : { usedAt: null };

    const [items, total] = await Promise.all([
      this.prisma.topicQueue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.topicQueue.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markDone(userId: string, id: string, done: boolean) {
    const existing = await this.prisma.topicQueue.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Topic not found');

    const topic = await this.prisma.topicQueue.update({
      where: { id },
      data: { usedAt: done ? new Date() : null },
    });
    await this.auditLog.record(userId, 'topic_queue', topic.id, 'UPDATE', {
      usedAt: topic.usedAt,
    });
    return topic;
  }
}
