import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateTransactionDto {
  @IsUUID()
  accountId: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsIn(['INCOME', 'EXPENSE'])
  type: 'INCOME' | 'EXPENSE';

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;

  @IsDateString()
  date: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  /**
   * Multi-currency snapshot: if the transaction was originally made in a
   * currency other than the account's, record the original amount/currency
   * and the exchange rate used to convert it into `amount` (account currency).
   * Purely informational — balance calculations always use `amount`.
   */
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  originalAmount?: number;

  @IsString()
  @MaxLength(10)
  @IsOptional()
  originalCurrency?: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  exchangeRate?: number;
}
