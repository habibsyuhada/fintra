import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  private async assertAccountOwnership(userId: string, accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Account not found');
    if (account.userId !== userId) throw new ForbiddenException();
  }

  private async assertCategory(
    userId: string,
    categoryId: string,
    type: 'INCOME' | 'EXPENSE',
  ) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');
    if (category.userId !== userId) throw new ForbiddenException();
    if (category.type !== type) {
      throw new BadRequestException(`Category type must be ${type}`);
    }
  }

  private async findOwnedTransaction(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: { account: true },
    });
    if (!transaction || transaction.isDeleted)
      throw new NotFoundException('Transaction not found');
    if (transaction.account.userId !== userId) throw new ForbiddenException();
    return transaction;
  }

  async create(userId: string, dto: CreateTransactionDto) {
    await this.assertAccountOwnership(userId, dto.accountId);
    if (dto.categoryId) {
      await this.assertCategory(userId, dto.categoryId, dto.type);
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        accountId: dto.accountId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        type: dto.type,
        note: dto.note,
        date: new Date(dto.date),
        tags: dto.tags ?? [],
        attachmentUrl: dto.attachmentUrl,
      },
    });
    await this.auditLog.record(
      userId,
      'transaction',
      transaction.id,
      'CREATE',
      { ...dto },
    );
    return transaction;
  }

  async findAll(userId: string, query: QueryTransactionDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    if (query.accountId) {
      await this.assertAccountOwnership(userId, query.accountId);
    }

    const where = {
      isDeleted: false,
      account: { userId },
      ...(query.accountId ? { accountId: query.accountId } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            date: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          category: true,
          account: { select: { id: true, name: true, currency: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(userId: string, id: string) {
    return this.findOwnedTransaction(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const existing = await this.findOwnedTransaction(userId, id);

    const targetAccountId = dto.accountId ?? existing.accountId;
    if (dto.accountId) {
      await this.assertAccountOwnership(userId, dto.accountId);
    }
    const targetType = dto.type ?? existing.type;
    if (dto.categoryId) {
      await this.assertCategory(
        userId,
        dto.categoryId,
        targetType as 'INCOME' | 'EXPENSE',
      );
    }

    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: {
        accountId: targetAccountId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        type: dto.type,
        note: dto.note,
        date: dto.date ? new Date(dto.date) : undefined,
        tags: dto.tags,
        attachmentUrl: dto.attachmentUrl,
      },
    });
    await this.auditLog.record(userId, 'transaction', id, 'UPDATE', { ...dto });
    return transaction;
  }

  async remove(userId: string, id: string) {
    await this.findOwnedTransaction(userId, id);
    await this.prisma.transaction.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    await this.auditLog.record(userId, 'transaction', id, 'DELETE', {
      softDelete: true,
    });
    return { success: true };
  }
}
