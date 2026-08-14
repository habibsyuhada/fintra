import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecurringRulesService } from './recurring-rules.service';

@Injectable()
export class RecurringRulesCron {
  constructor(private readonly recurringRulesService: RecurringRulesService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleDueRules() {
    await this.recurringRulesService.runDue();
  }
}
