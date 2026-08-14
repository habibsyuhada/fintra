import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { ReceiptsService } from './receipts.service';
import { ConfirmReceiptDto } from './dto/confirm-receipt.dto';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@UseGuards(JwtAccessGuard)
@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('scan')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  scan(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File struk wajib diunggah');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Format file tidak didukung');
    }
    return this.receiptsService.scan(user.userId, file);
  }

  @Get()
  findAll(@CurrentUser() user: RequestUser) {
    return this.receiptsService.findAll(user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.receiptsService.findOne(user.userId, id);
  }

  @Post(':id/confirm')
  confirm(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ConfirmReceiptDto,
  ) {
    return this.receiptsService.confirm(user.userId, id, dto);
  }

  @Post(':id/reject')
  reject(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.receiptsService.reject(user.userId, id);
  }
}
