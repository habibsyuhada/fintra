import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { ExportsService } from './exports.service';
import { ExportQueryDto } from './dto/export-query.dto';

const CONTENT_TYPES: Record<string, string> = {
  csv: 'text/csv; charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

@UseGuards(JwtAccessGuard)
@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('transactions')
  async exportTransactions(
    @CurrentUser() user: RequestUser,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ) {
    const filename = `fintra-transaksi-${new Date().toISOString().slice(0, 10)}.${query.format}`;
    res.setHeader('Content-Type', CONTENT_TYPES[query.format]);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (query.format === 'csv') {
      res.send(await this.exportsService.toCsv(user.userId, query));
      return;
    }
    if (query.format === 'xlsx') {
      res.send(await this.exportsService.toXlsx(user.userId, query));
      return;
    }
    res.send(await this.exportsService.toPdf(user.userId, query));
  }
}
