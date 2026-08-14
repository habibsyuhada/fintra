import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class CashflowQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  year?: number;
}

export class CategoryBreakdownQueryDto {
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsIn(['INCOME', 'EXPENSE'])
  @IsOptional()
  type?: 'INCOME' | 'EXPENSE';
}

export class TrendQueryDto {
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsIn(['day', 'week', 'month'])
  @IsOptional()
  granularity?: 'day' | 'week' | 'month';

  @IsIn(['INCOME', 'EXPENSE'])
  @IsOptional()
  type?: 'INCOME' | 'EXPENSE';
}
