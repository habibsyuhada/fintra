import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateRecurringRuleDto } from './dto/create-recurring-rule.dto';
import { UpdateRecurringRuleDto } from './dto/update-recurring-rule.dto';

type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

const MAX_CATCHUP_RUNS = 60;

function advance(date: Date, frequency: Frequency): Date {
  const next = new Date(date);
  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + 1);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

@Injectable()
export class RecurringRulesService {
  private readonly logger = new Logger(RecurringRulesService.name);

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

  private async findOwned(userId: string, id: string) {
    const rule = await this.prisma.recurringRule.findUnique({
      where: { id },
      include: { account: true },
    });
    if (!rule) throw new NotFoundException('Recurring rule not found');
    if (rule.account.userId !== userId) throw new ForbiddenException();
    return rule;
  }

  async create(userId: string, dto: CreateRecurringRuleDto) {
    await this.assertAccountOwnership(userId, dto.accountId);
    if (dto.categoryId) {
      await this.assertCategory(userId, dto.categoryId, dto.type);
    }
    const rule = await this.prisma.recurringRule.create({
      data: {
        accountId: dto.accountId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        type: dto.type,
        note: dto.note,
        frequency: dto.frequency,
        nextRunDate: new Date(dto.nextRunDate),
      },
    });
    await this.auditLog.record(userId, 'recurring_rule', rule.id, 'CREATE', {
      ...dto,
    });
    return rule;
  }

  findAll(userId: string) {
    return this.prisma.recurringRule.findMany({
      where: { account: { userId } },
      include: {
        account: { select: { id: true, name: true } },
        category: true,
      },
      orderBy: { nextRunDate: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    return this.findOwned(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateRecurringRuleDto) {
    await this.findOwned(userId, id);
    if (dto.categoryId && dto.type) {
      await this.assertCategory(userId, dto.categoryId, dto.type);
    }
    const rule = await this.prisma.recurringRule.update({
      where: { id },
      data: {
        categoryId: dto.categoryId,
        amount: dto.amount,
        type: dto.type,
        note: dto.note,
        frequency: dto.frequency,
        nextRunDate: dto.nextRunDate ? new Date(dto.nextRunDate) : undefined,
        isActive: dto.isActive,
      },
    });
    await this.auditLog.record(userId, 'recurring_rule', id, 'UPDATE', {
      ...dto,
    });
    return rule;
  }

  async remove(userId: string, id: string) {
    await this.findOwned(userId, id);
    await this.prisma.recurringRule.delete({ where: { id } });
    await this.auditLog.record(userId, 'recurring_rule', id, 'DELETE');
    return { success: true };
  }

  /**
   * Processes every active rule whose nextRunDate has arrived, creating the
   * corresponding transaction(s) and advancing nextRunDate. Catches up
   * multiple missed periods (bounded by MAX_CATCHUP_RUNS) if the process
   * was down when a rule was due.
   */
  async runDue(now = new Date()) {
    const dueRules = await this.prisma.recurringRule.findMany({
      where: { isActive: true, nextRunDate: { lte: now } },
    });

    let created = 0;
    for (const rule of dueRules) {
      let cursor = rule.nextRunDate;
      let iterations = 0;
      while (cursor <= now && iterations < MAX_CATCHUP_RUNS) {
        await this.prisma.transaction.create({
          data: {
            accountId: rule.accountId,
            categoryId: rule.categoryId,
            amount: rule.amount,
            type: rule.type,
            note: rule.note,
            date: cursor,
            isRecurringInstance: true,
            recurringRuleId: rule.id,
          },
        });
        created += 1;
        cursor = advance(cursor, rule.frequency);
        iterations += 1;
      }
      await this.prisma.recurringRule.update({
        where: { id: rule.id },
        data: { nextRunDate: cursor },
      });
    }

    if (dueRules.length > 0) {
      this.logger.log(
        `Processed ${dueRules.length} due recurring rule(s), created ${created} transaction(s)`,
      );
    }
    return { rulesProcessed: dueRules.length, transactionsCreated: created };
  }
}
