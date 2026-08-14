import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  private async findOwned(userId: string, id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    if (category.userId !== userId) throw new ForbiddenException();
    return category;
  }

  async create(userId: string, dto: CreateCategoryDto) {
    if (dto.parentId) {
      const parent = await this.findOwned(userId, dto.parentId);
      if (parent.type !== dto.type) {
        throw new BadRequestException(
          'Subcategory type must match parent category type',
        );
      }
    }
    const category = await this.prisma.category.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        icon: dto.icon,
        color: dto.color,
        parentId: dto.parentId,
      },
    });
    await this.auditLog.record(userId, 'category', category.id, 'CREATE', {
      ...dto,
    });
    return category;
  }

  findAll(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      include: { subcategories: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    return this.findOwned(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    await this.findOwned(userId, id);
    if (dto.parentId === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }
    const category = await this.prisma.category.update({
      where: { id },
      data: dto,
    });
    await this.auditLog.record(userId, 'category', id, 'UPDATE', { ...dto });
    return category;
  }

  async remove(userId: string, id: string) {
    await this.findOwned(userId, id);
    await this.prisma.category.delete({ where: { id } });
    await this.auditLog.record(userId, 'category', id, 'DELETE');
    return { success: true };
  }
}
