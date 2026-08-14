import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsPositive,
  IsUUID,
} from 'class-validator';

export class CreateBudgetDto {
  @IsUUID()
  categoryId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsIn(['WEEKLY', 'MONTHLY', 'YEARLY'])
  period: 'WEEKLY' | 'MONTHLY' | 'YEARLY';

  @IsDateString()
  startDate: string;
}
