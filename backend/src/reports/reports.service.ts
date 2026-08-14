import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import {
  CashflowQueryDto,
  CategoryBreakdownQueryDto,
  TrendQueryDto,
} from './dto/report-query.dto';

interface CashflowRow {
  month: Date;
  type: 'INCOME' | 'EXPENSE';
  total: Prisma.Decimal;
}

interface TrendRow {
  bucket: Date;
  total: Prisma.Decimal;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async cashflow(userId: string, query: CashflowQueryDto) {
    const year = query.year ?? new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const rows = await this.prisma.$queryRaw<CashflowRow[]>`
      SELECT date_trunc('month', t.date) AS month, t.type AS type, SUM(t.amount) AS total
      FROM transactions t
      JOIN accounts a ON a.id = t.account_id
      WHERE a.user_id = ${userId}
        AND t.is_deleted = false
        AND t.date >= ${start}
        AND t.date < ${end}
        AND t.type IN ('INCOME', 'EXPENSE')
      GROUP BY 1, 2
      ORDER BY month ASC
    `;

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0,
      net: 0,
    }));

    for (const row of rows) {
      const monthIndex = new Date(row.month).getMonth();
      const total = Number(row.total);
      if (row.type === 'INCOME') months[monthIndex].income = total;
      if (row.type === 'EXPENSE') months[monthIndex].expense = total;
    }
    months.forEach((m) => (m.net = m.income - m.expense));

    return { year, months };
  }

  async categoryBreakdown(userId: string, query: CategoryBreakdownQueryDto) {
    const type = query.type ?? 'EXPENSE';
    const where = {
      type,
      isDeleted: false,
      account: { userId },
      categoryId: { not: null },
      ...(query.dateFrom || query.dateTo
        ? {
            date: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
    };

    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const categoryIds = grouped
      .map((g) => g.categoryId)
      .filter((id): id is string => Boolean(id));
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const total = grouped.reduce(
      (sum, g) => sum + Number(g._sum.amount ?? 0),
      0,
    );

    return {
      type,
      total,
      items: grouped.map((g) => {
        const category = g.categoryId
          ? categoryMap.get(g.categoryId)
          : undefined;
        const amount = Number(g._sum.amount ?? 0);
        return {
          categoryId: g.categoryId,
          categoryName: category?.name ?? 'Tanpa kategori',
          color: category?.color ?? null,
          amount,
          percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
        };
      }),
    };
  }

  async trend(userId: string, query: TrendQueryDto) {
    const type = query.type ?? 'EXPENSE';
    const granularity = query.granularity ?? 'day';
    const end = query.dateTo ? new Date(query.dateTo) : new Date();
    const start = query.dateFrom
      ? new Date(query.dateFrom)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const rows = await this.prisma.$queryRaw<TrendRow[]>`
      SELECT date_trunc(${granularity}, t.date) AS bucket, SUM(t.amount) AS total
      FROM transactions t
      JOIN accounts a ON a.id = t.account_id
      WHERE a.user_id = ${userId}
        AND t.is_deleted = false
        AND t.type = ${type}
        AND t.date >= ${start}
        AND t.date <= ${end}
      GROUP BY 1
      ORDER BY bucket ASC
    `;

    return {
      type,
      granularity,
      items: rows.map((row) => ({
        date: row.bucket,
        total: Number(row.total),
      })),
    };
  }
}
