import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

type BudgetPeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

function currentPeriodWindow(
  period: BudgetPeriod,
  now = new Date(),
): { start: Date; end: Date } {
  if (period === 'WEEKLY') {
    const day = (now.getDay() + 6) % 7; // Monday = 0
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - day);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }
  if (period === 'YEARLY') {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear() + 1, 0, 1);
    return { start, end };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

@Injectable()
export class BudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  private async findOwned(userId: string, id: string) {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget) throw new NotFoundException('Budget not found');
    if (budget.userId !== userId) throw new ForbiddenException();
    return budget;
  }

  private async assertCategory(userId: string, categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');
    if (category.userId !== userId) throw new ForbiddenException();
    if (category.type !== 'EXPENSE') {
      throw new BadRequestException(
        'Budgets can only be set for expense categories',
      );
    }
    return category;
  }

  private async withSpent<
    T extends {
      id: string;
      categoryId: string;
      amount: unknown;
      period: string;
    },
  >(budget: T) {
    const { start, end } = currentPeriodWindow(budget.period as BudgetPeriod);
    const spentSum = await this.prisma.transaction.aggregate({
      where: {
        categoryId: budget.categoryId,
        type: 'EXPENSE',
        isDeleted: false,
        date: { gte: start, lt: end },
      },
      _sum: { amount: true },
    });

    const spent = spentSum._sum.amount ?? 0;
    const amountNum = Number(budget.amount);
    const spentNum = Number(spent);
    const percentage =
      amountNum > 0 ? Math.round((spentNum / amountNum) * 100) : 0;
    const status =
      percentage >= 100 ? 'OVER' : percentage >= 80 ? 'NEAR' : 'OK';

    return {
      ...budget,
      periodStart: start,
      periodEnd: end,
      spent: spentNum,
      remaining: amountNum - spentNum,
      percentage,
      status,
    };
  }

  async create(userId: string, dto: CreateBudgetDto) {
    await this.assertCategory(userId, dto.categoryId);
    const budget = await this.prisma.budget.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        period: dto.period,
        startDate: new Date(dto.startDate),
      },
    });
    await this.auditLog.record(userId, 'budget', budget.id, 'CREATE', {
      ...dto,
    });
    return this.withSpent(budget);
  }

  async findAll(userId: string) {
    const budgets = await this.prisma.budget.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(budgets.map((budget) => this.withSpent(budget)));
  }

  async findOne(userId: string, id: string) {
    const budget = await this.findOwned(userId, id);
    return this.withSpent(budget);
  }

  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    await this.findOwned(userId, id);
    if (dto.categoryId) {
      await this.assertCategory(userId, dto.categoryId);
    }
    const budget = await this.prisma.budget.update({
      where: { id },
      data: {
        categoryId: dto.categoryId,
        amount: dto.amount,
        period: dto.period,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      },
    });
    await this.auditLog.record(userId, 'budget', id, 'UPDATE', { ...dto });
    return this.withSpent(budget);
  }

  async remove(userId: string, id: string) {
    await this.findOwned(userId, id);
    await this.prisma.budget.delete({ where: { id } });
    await this.auditLog.record(userId, 'budget', id, 'DELETE');
    return { success: true };
  }
}
