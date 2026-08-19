import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { QueryArticleDto } from './dto/query-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  private async findExisting(idOrSlug: string) {
    const article = await this.prisma.article.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  async findAll(query: QueryArticleDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where = {
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.article.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(idOrSlug: string) {
    return this.findExisting(idOrSlug);
  }

  async update(userId: string, idOrSlug: string, dto: UpdateArticleDto) {
    const existing = await this.findExisting(idOrSlug);
    const article = await this.prisma.article.update({
      where: { id: existing.id },
      data: {
        status: dto.status,
        isPublic: dto.isPublic,
      },
    });
    await this.auditLog.record(userId, 'article', article.id, 'UPDATE', {
      ...dto,
    });
    return article;
  }
}
