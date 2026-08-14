import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';
import {
  CashflowQueryDto,
  CategoryBreakdownQueryDto,
  TrendQueryDto,
} from './dto/report-query.dto';

@UseGuards(JwtAccessGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('cashflow')
  cashflow(@CurrentUser() user: RequestUser, @Query() query: CashflowQueryDto) {
    return this.reportsService.cashflow(user.userId, query);
  }

  @Get('category-breakdown')
  categoryBreakdown(
    @CurrentUser() user: RequestUser,
    @Query() query: CategoryBreakdownQueryDto,
  ) {
    return this.reportsService.categoryBreakdown(user.userId, query);
  }

  @Get('trend')
  trend(@CurrentUser() user: RequestUser, @Query() query: TrendQueryDto) {
    return this.reportsService.trend(user.userId, query);
  }
}
