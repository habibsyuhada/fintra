import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { RecurringRulesService } from './recurring-rules.service';
import { CreateRecurringRuleDto } from './dto/create-recurring-rule.dto';
import { UpdateRecurringRuleDto } from './dto/update-recurring-rule.dto';

@UseGuards(JwtAccessGuard)
@Controller('recurring-rules')
export class RecurringRulesController {
  constructor(private readonly recurringRulesService: RecurringRulesService) {}

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateRecurringRuleDto,
  ) {
    return this.recurringRulesService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: RequestUser) {
    return this.recurringRulesService.findAll(user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.recurringRulesService.findOne(user.userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateRecurringRuleDto,
  ) {
    return this.recurringRulesService.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.recurringRulesService.remove(user.userId, id);
  }
}
