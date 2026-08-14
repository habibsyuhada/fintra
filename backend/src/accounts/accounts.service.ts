import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  private async computeBalance(
    accountId: string,
    initialBalance: Prisma.Decimal,
  ) {
    const [incomeSum, expenseSum, transfersIn, transfersOut] =
      await Promise.all([
        this.prisma.transaction.aggregate({
          where: { accountId, type: 'INCOME', isDeleted: false },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { accountId, type: 'EXPENSE', isDeleted: false },
          _sum: { amount: true },
        }),
        this.prisma.transfer.aggregate({
          where: { toAccountId: accountId },
          _sum: { amount: true },
        }),
        this.prisma.transfer.aggregate({
          where: { fromAccountId: accountId },
          _sum: { amount: true },
        }),
      ]);

    return initialBalance
      .plus(incomeSum._sum.amount ?? 0)
      .minus(expenseSum._sum.amount ?? 0)
      .plus(transfersIn._sum.amount ?? 0)
      .minus(transfersOut._sum.amount ?? 0);
  }

  private async findOwned(userId: string, accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Account not found');
    if (account.userId !== userId) throw new ForbiddenException();
    return account;
  }

  async create(userId: string, dto: CreateAccountDto) {
    const account = await this.prisma.account.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        currency: dto.currency ?? 'IDR',
        initialBalance: dto.initialBalance ?? 0,
      },
    });
    return { ...account, balance: account.initialBalance };
  }

  async findAll(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return Promise.all(
      accounts.map(async (account) => ({
        ...account,
        balance: await this.computeBalance(account.id, account.initialBalance),
      })),
    );
  }

  async findOne(userId: string, id: string) {
    const account = await this.findOwned(userId, id);
    return {
      ...account,
      balance: await this.computeBalance(account.id, account.initialBalance),
    };
  }

  async update(userId: string, id: string, dto: UpdateAccountDto) {
    await this.findOwned(userId, id);
    const account = await this.prisma.account.update({
      where: { id },
      data: dto,
    });
    return {
      ...account,
      balance: await this.computeBalance(account.id, account.initialBalance),
    };
  }

  async remove(userId: string, id: string) {
    await this.findOwned(userId, id);
    await this.prisma.account.update({
      where: { id },
      data: { isArchived: true },
    });
    return { success: true };
  }
}
