import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateRecurringRuleDto } from './create-recurring-rule.dto';

export class UpdateRecurringRuleDto extends PartialType(
  CreateRecurringRuleDto,
) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
