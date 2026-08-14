import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(
    userId: string | null,
    entity: string,
    entityId: string,
    action: AuditAction,
    changes?: Record<string, unknown>,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          entity,
          entityId,
          action,
          changes: changes
            ? (JSON.parse(JSON.stringify(changes)) as object)
            : undefined,
        },
      });
    } catch (err) {
      // Audit logging must never break the primary operation it's recording.
      this.logger.error(
        `Failed to write audit log for ${entity}:${entityId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
