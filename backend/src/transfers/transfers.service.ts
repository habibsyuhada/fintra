import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateTransferDto } from './dto/create-transfer.dto';

@Injectable()
export class TransfersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  private async assertOwnership(userId: string, accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Account not found');
    if (account.userId !== userId) throw new ForbiddenException();
    return account;
  }

  async create(userId: string, dto: CreateTransferDto) {
    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException(
        'fromAccountId and toAccountId must differ',
      );
    }
    await this.assertOwnership(userId, dto.fromAccountId);
    await this.assertOwnership(userId, dto.toAccountId);

    const transfer = await this.prisma.transfer.create({
      data: {
        fromAccountId: dto.fromAccountId,
        toAccountId: dto.toAccountId,
        amount: dto.amount,
        date: new Date(dto.date),
        note: dto.note,
      },
    });
    await this.auditLog.record(userId, 'transfer', transfer.id, 'CREATE', {
      ...dto,
    });
    return transfer;
  }

  async findAll(userId: string, accountId?: string) {
    if (accountId) {
      await this.assertOwnership(userId, accountId);
    }

    const ownershipFilter = accountId
      ? [{ fromAccountId: accountId }, { toAccountId: accountId }]
      : [{ fromAccount: { userId } }, { toAccount: { userId } }];

    return this.prisma.transfer.findMany({
      where: { OR: ownershipFilter },
      include: {
        fromAccount: { select: { id: true, name: true } },
        toAccount: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async remove(userId: string, id: string) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id },
      include: { fromAccount: true },
    });
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.fromAccount.userId !== userId) throw new ForbiddenException();
    await this.prisma.transfer.delete({ where: { id } });
    await this.auditLog.record(userId, 'transfer', id, 'DELETE');
    return { success: true };
  }
}
