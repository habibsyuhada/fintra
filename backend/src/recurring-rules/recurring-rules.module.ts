import { Module } from '@nestjs/common';
import { RecurringRulesController } from './recurring-rules.controller';
import { RecurringRulesService } from './recurring-rules.service';
import { RecurringRulesCron } from './recurring-rules.cron';

@Module({
  controllers: [RecurringRulesController],
  providers: [RecurringRulesService, RecurringRulesCron],
  exports: [RecurringRulesService],
})
export class RecurringRulesModule {}
