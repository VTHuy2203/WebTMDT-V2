import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class NotificationService {
  constructor(private readonly db: PrismaService) {}

  async list(userId: string, unreadOnly = false) {
    const rows = await this.db.notification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return rows.map((row) => this.dto(row));
  }

  async create(userId: string, type: string, title: string, body: string, data: any = {}) {
    const notification = await this.db.notification.create({
      data: { userId, type, title, body, data },
    });
    await this.db.outboxEvent.create({
      data: {
        aggregateType: "NOTIFICATION",
        aggregateId: notification.id,
        eventType: "NOTIFICATION_CREATED",
        payload: { notificationId: notification.id, userId },
      },
    });
    return notification;
  }

  async read(userId: string, id: string) {
    const result = await this.db.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
    if (!result.count) throw new NotFoundException();
    return this.dto(await this.db.notification.findUnique({ where: { id } }));
  }

  async readAll(userId: string) {
    const result = await this.db.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }

  private dto(row: any) {
    if (!row) return row;
    return {
      ...row,
      content: row.body,
      isRead: Boolean(row.readAt),
      createdAt: row.createdAt.toISOString(),
      readAt: row.readAt?.toISOString() ?? null,
    };
  }
}
