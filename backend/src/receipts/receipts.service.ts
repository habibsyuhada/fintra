import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { OpenRouterService } from './openrouter.service';
import { ConfirmReceiptDto } from './dto/confirm-receipt.dto';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'receipts');

@Injectable()
export class ReceiptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openRouter: OpenRouterService,
    private readonly transactionsService: TransactionsService,
  ) {}

  private async findOwned(userId: string, id: string) {
    const receipt = await this.prisma.receipt.findUnique({ where: { id } });
    if (!receipt) throw new NotFoundException('Receipt not found');
    if (receipt.userId !== userId) throw new ForbiddenException();
    return receipt;
  }

  async scan(userId: string, file: Express.Multer.File) {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${randomUUID()}${extname(file.originalname) || '.jpg'}`;
    await writeFile(join(UPLOAD_DIR, filename), file.buffer);
    const imageUrl = `/uploads/receipts/${filename}`;

    try {
      const extraction = await this.openRouter.extractReceipt(
        file.buffer,
        file.mimetype,
      );
      const receipt = await this.prisma.receipt.create({
        data: {
          userId,
          imageUrl,
          rawAiResponse: JSON.parse(JSON.stringify(extraction)) as object,
          status: 'PENDING',
        },
      });
      return { receipt, draft: extraction };
    } catch (err) {
      // Parsing/AI failure: still keep the uploaded photo as a receipt record
      // so the user can fall back to manual entry without re-uploading.
      const receipt = await this.prisma.receipt.create({
        data: { userId, imageUrl, rawAiResponse: undefined, status: 'PENDING' },
      });
      return {
        receipt,
        draft: null,
        error:
          err instanceof Error
            ? err.message
            : 'Gagal memproses struk, silakan isi manual',
      };
    }
  }

  async findAll(userId: string) {
    return this.prisma.receipt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    return this.findOwned(userId, id);
  }

  async confirm(userId: string, id: string, dto: ConfirmReceiptDto) {
    const receipt = await this.findOwned(userId, id);
    if (receipt.status !== 'PENDING') {
      throw new BadRequestException('Receipt already reviewed');
    }

    const transaction = await this.transactionsService.create(userId, {
      ...dto,
      attachmentUrl: receipt.imageUrl,
    });

    await this.prisma.receipt.update({
      where: { id },
      data: { transactionId: transaction.id, status: 'CONFIRMED' },
    });

    return transaction;
  }

  async reject(userId: string, id: string) {
    const receipt = await this.findOwned(userId, id);
    if (receipt.status !== 'PENDING') {
      throw new BadRequestException('Receipt already reviewed');
    }
    await this.prisma.receipt.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
    return { success: true };
  }
}
