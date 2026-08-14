import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAccessGuard)
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        userId: user.userId,
        ...(entity ? { entity } : {}),
        ...(entityId ? { entityId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
