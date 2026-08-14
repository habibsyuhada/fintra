import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';

@UseGuards(JwtAccessGuard)
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateTransferDto) {
    return this.transfersService.create(user.userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('accountId') accountId?: string,
  ) {
    return this.transfersService.findAll(user.userId, accountId);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.transfersService.remove(user.userId, id);
  }
}
