import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { QueryArticleDto } from './dto/query-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { CreateInternalArticleDto } from './dto/create-internal-article.dto';

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function startOfTodayWIB(now = new Date()): Date {
  const wibNow = new Date(now.getTime() + WIB_OFFSET_MS);
  const wibMidnightUTC = Date.UTC(
    wibNow.getUTCFullYear(),
    wibNow.getUTCMonth(),
    wibNow.getUTCDate(),
  );
  return new Date(wibMidnightUTC - WIB_OFFSET_MS);
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'artikel'
  );
}

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

  private async uniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let suffix = 1;
    while (await this.prisma.article.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }
    return slug;
  }

  /** Called by the daily article-generator Routine via POST
   * /articles/internal. Idempotent — rejects if an article was already
   * created today (WIB), same guarantee the old cron script gave. */
  async createFromGenerator(dto: CreateInternalArticleDto) {
    const alreadyGenerated = await this.prisma.article.count({
      where: { createdAt: { gte: startOfTodayWIB() } },
    });
    if (alreadyGenerated > 0) {
      throw new ConflictException('Artikel hari ini (WIB) sudah pernah dibuat');
    }

    const slug = await this.uniqueSlug(slugify(dto.title));
    return this.prisma.article.create({
      data: {
        title: dto.title,
        slug,
        bodyMd: dto.bodyMd,
        sources: dto.sources
          ? (JSON.parse(JSON.stringify(dto.sources)) as object)
          : undefined,
        status: 'UNREAD',
        isPublic: false,
      },
    });
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
