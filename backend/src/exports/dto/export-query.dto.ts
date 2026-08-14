import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';

export class ExportQueryDto {
  @IsIn(['csv', 'xlsx', 'pdf'])
  format: 'csv' | 'xlsx' | 'pdf';

  @IsUUID()
  @IsOptional()
  accountId?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsIn(['INCOME', 'EXPENSE'])
  @IsOptional()
  type?: 'INCOME' | 'EXPENSE';

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
