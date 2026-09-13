import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { NotificationService } from "./notification.service";

@Injectable()
export class MessagingService {
  private readonly handoffMessage = "Tôi đã chuyển tin nhắn này đến bộ phận chuyên môn.";

  constructor(
    private readonly db: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  async list(userId: string) {
    return this.db.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: { include: { user: { select: { id: true, fullName: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async adminList() {
    const rows = await this.db.conversation.findMany({
      include: {
        participants: {
          include: {
            user: { select: { id: true, fullName: true, emailNormalized: true } },
          },
        },
        messages: {
          include: { sender: { select: { id: true, fullName: true, emailNormalized: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((row) => {
      const customer = row.participants.find((participant) => participant.role !== "ADMIN")?.user;
      const last = row.messages.at(-1);
      return {
        id: row.id,
        userId: customer?.id ?? "",
        userName: customer?.fullName ?? "Người dùng",
        userEmail: customer?.emailNormalized ?? "",
        subject: row.subject,
        lastMessage: last?.body ?? "",
        lastMessageAt: (last?.createdAt ?? row.createdAt).toISOString(),
        status: row.status,
        automationEnabled: row.automationEnabled,
        handoffAt: row.handoffAt?.toISOString() ?? null,
        unreadCount: row.status === "UNREAD" ? 1 : 0,
        messages: row.messages.map((message) => ({
          id: message.id,
          conversationId: row.id,
          sender: message.senderId === customer?.id ? "user" : "admin",
          senderName: message.sender.fullName,
          senderEmail: message.sender.emailNormalized,
          text: message.body,
          createdAt: message.createdAt.toISOString(),
        })),
        createdAt: row.createdAt.toISOString(),
      };
    });
  }

  async adminSupport(userId: string) {
    const actor = await this.db.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    const actorRoles = actor?.roles.map((item) => item.role.key) ?? [];
    if (actorRoles.some((role) => ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(role)))
      throw new ForbiddenException({
        code: "BUYER_ACCOUNT_REQUIRED",
        message: "Tài khoản quản trị không thể gửi tin từ khung chat người mua",
      });
    const existing = await this.db.conversation.findFirst({
      where: {
        orderId: null,
        participants: { some: { userId, role: "CREATOR" } },
        AND: { participants: { some: { role: "ADMIN" } } },
      },
      include: { participants: true },
      orderBy: { updatedAt: "desc" },
    });
    if (existing) return existing;
    const admin = await this.db.user.findFirst({
      where: {
        status: "ACTIVE",
        roles: { some: { role: { key: { in: ["ADMIN", "SUPER_ADMIN"] } } } },
      },
      orderBy: { createdAt: "asc" },
    });
    if (!admin)
      throw new NotFoundException({ code: "ADMIN_UNAVAILABLE", message: "Chưa có tài khoản Admin hỗ trợ" });
    return this.db.conversation.create({
      data: {
        subject: "Hỗ trợ trực tiếp với Admin",
        status: "UNREAD",
        participants: {
          create: [
            { userId, role: "CREATOR" },
            { userId: admin.id, role: "ADMIN" },
          ],
        },
      },
      include: { participants: true },
    });
  }

  async participantIds(conversationId: string) {
    const rows = await this.db.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    return rows.map((row) => row.userId);
  }

  async adminReply(adminId: string, conversationId: string, input: any) {
    const body = this.messageBody(input);
    await this.db.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId, userId: adminId } },
      create: { conversationId, userId: adminId, role: "ADMIN" },
      update: {},
    });
    const result = await this.db.$transaction(async (tx) => {
      const handoff = await tx.conversation.updateMany({
        where: { id: conversationId, automationEnabled: true },
        data: { automationEnabled: false, handoffAt: new Date() },
      });
      const messages = [];
      if (handoff.count === 1) {
        messages.push(await tx.message.create({
          data: { conversationId, senderId: adminId, body: this.handoffMessage, attachments: [] },
          include: { sender: { select: { id: true, fullName: true } } },
        }));
      }
      const message = await tx.message.create({
        data: { conversationId, senderId: adminId, body, attachments: [] },
        include: { sender: { select: { id: true, fullName: true } } },
      });
      messages.push(message);
      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          status: "REPLIED",
          updatedAt: new Date(),
        },
      });
      return { message, messages };
    });
    const recipients = (await this.participantIds(conversationId)).filter((id) => id !== adminId);
    for (const message of result.messages) {
      for (const userId of recipients) {
        await this.notifications.create(
          userId,
          "NEW_MESSAGE",
          "Tin nhắn mới từ bộ phận hỗ trợ",
          message.body.slice(0, 160),
          { conversationId, messageId: message.id },
        );
      }
    }
    return result;
  }

  adminStatus(conversationId: string, status: string) {
    return this.db.conversation.update({ where: { id: conversationId }, data: { status } });
  }

  async adminAutomation(
    adminId: string,
    conversationId: string,
    enabled: boolean,
    requestId: string,
  ) {
    const conversation = await this.db.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException();
    return this.db.$transaction(async (tx) => {
      const updated = await tx.conversation.update({
        where: { id: conversationId },
        data: {
          automationEnabled: enabled,
          handoffAt: enabled ? null : new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: adminId,
          action: enabled ? "CHAT_AUTOMATION_ENABLED" : "CHAT_AUTOMATION_DISABLED",
          targetType: "CONVERSATION",
          targetId: conversationId,
          requestId,
          metadata: { automationEnabled: enabled },
        },
      });
      return updated;
    });
  }

  async create(userId: string, input: any) {
    const participantIds = [...new Set<string>([userId, ...(input.participantIds ?? [])])];
    if (participantIds.length < 2)
      throw new BadRequestException({
        code: "PARTICIPANT_REQUIRED",
        message: "Cuộc trò chuyện cần ít nhất hai thành viên",
      });
    const users = await this.db.user.findMany({ where: { id: { in: participantIds } } });
    if (users.length !== participantIds.length)
      throw new BadRequestException({ code: "INVALID_PARTICIPANT", message: "Thành viên không hợp lệ" });
    if (input.orderId) await this.assertOrderAccess(userId, input.orderId);
    return this.db.conversation.create({
      data: {
        orderId: input.orderId || null,
        subject: String(input.subject ?? "Trao đổi đơn hàng").slice(0, 200),
        participants: {
          create: participantIds.map((id) => ({ userId: id, role: id === userId ? "CREATOR" : "MEMBER" })),
        },
      },
      include: { participants: true },
    });
  }

  async messages(userId: string, conversationId: string, before?: string) {
    const member = await this.assertMember(userId, conversationId);
    const rows = await this.db.message.findMany({
      where: {
        conversationId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      include: { sender: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const roles = new Map(
      member.conversation.participants.map((participant) => [participant.userId, participant.role]),
    );
    return rows.map((message) => ({ ...message, senderRole: roles.get(message.senderId) ?? "MEMBER" }));
  }

  async send(userId: string, conversationId: string, input: any) {
    const member = await this.assertMember(userId, conversationId);
    const body = this.messageBody(input);
    const attachmentIds = Array.isArray(input.attachmentIds) ? input.attachmentIds : [];
    if (attachmentIds.length) {
      const count = await this.db.mediaObject.count({
        where: { id: { in: attachmentIds }, ownerId: userId, status: "READY" },
      });
      if (count !== attachmentIds.length)
        throw new BadRequestException({ code: "INVALID_ATTACHMENT", message: "Tệp đính kèm không hợp lệ" });
    }
    const message = await this.db.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: { conversationId, senderId: userId, body, attachments: attachmentIds },
        include: { sender: { select: { id: true, fullName: true } } },
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { status: member.role === "ADMIN" ? "REPLIED" : "UNREAD", updatedAt: new Date() },
      });
      return created;
    });
    for (const participant of member.conversation.participants.filter((x) => x.userId !== userId)) {
      await this.notifications.create(
        participant.userId,
        "NEW_MESSAGE",
        `Tin nhắn mới: ${member.conversation.subject}`,
        body.slice(0, 160),
        { conversationId, messageId: message.id },
      );
    }
    return message;
  }

  async sendWithAutomation(userId: string, conversationId: string, input: any) {
    const access = await this.assertMember(userId, conversationId);
    if (access.role === "ADMIN")
      throw new ForbiddenException({
        code: "ADMIN_REPLY_ENDPOINT_REQUIRED",
        message: "Admin phải trả lời từ hộp thư quản trị",
      });
    const message = await this.send(userId, conversationId, input);
    const conversation = await this.db.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });
    const sender = conversation?.participants.find((participant) => participant.userId === userId);
    const admin = conversation?.participants.find((participant) => participant.role === "ADMIN");
    if (!conversation?.automationEnabled || sender?.role === "ADMIN" || !admin) {
      return { message, messages: [message] };
    }

    const automaticReply = await this.db.$transaction(async (tx) => {
      const current = await tx.$queryRaw<Array<{ automation_enabled: boolean }>>`
        SELECT automation_enabled
        FROM conversations
        WHERE id = ${conversationId}::uuid
        FOR UPDATE
      `;
      if (!current[0]?.automation_enabled) return null;
      const created = await tx.message.create({
        data: {
          conversationId,
          senderId: admin.userId,
          body: this.automaticReply(message.body),
          attachments: [],
        },
        include: { sender: { select: { id: true, fullName: true } } },
      });
      await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
      return created;
    });
    if (!automaticReply) return { message, messages: [message] };
    await this.notifications.create(
      userId,
      "NEW_MESSAGE",
      "Phản hồi tự động từ bộ phận hỗ trợ",
      automaticReply.body.slice(0, 160),
      { conversationId, messageId: automaticReply.id },
    );
    return { message, messages: [message, automaticReply] };
  }

  async markRead(userId: string, conversationId: string) {
    await this.assertMember(userId, conversationId);
    return this.db.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
  }

  async assertMember(userId: string, conversationId: string) {
    const member = await this.db.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      include: { conversation: { include: { participants: true } } },
    });
    if (!member) throw new ForbiddenException({ code: "NOT_CONVERSATION_MEMBER", message: "Bạn không thuộc cuộc trò chuyện này" });
    return member;
  }

  private async assertOrderAccess(userId: string, orderId: string) {
    const order = await this.db.order.findFirst({
      where: {
        id: orderId,
        OR: [
          { group: { buyerId: userId } },
          { shop: { members: { some: { userId } } } },
        ],
      },
    });
    if (!order) throw new NotFoundException();
  }

  private messageBody(input: any) {
    const body = String(input?.body ?? input?.text ?? "").trim();
    if (!body || body.length > 5000)
      throw new BadRequestException({ code: "INVALID_MESSAGE", message: "Tin nhắn phải có từ 1 đến 5000 ký tự" });
    return body;
  }

  private automaticReply(body: string) {
    const text = body.toLocaleLowerCase("vi");
    if (/đơn hàng|mã đơn|giao hàng|vận chuyển/.test(text))
      return "Dạ, bạn vui lòng gửi mã đơn hàng để bộ phận hỗ trợ kiểm tra nhanh nhất ạ.";
    if (/thanh toán|chuyển khoản|qr|hoàn tiền/.test(text))
      return "Dạ, hệ thống đã ghi nhận yêu cầu về thanh toán. Bạn vui lòng gửi mã đơn hoặc nội dung giao dịch cần kiểm tra ạ.";
    if (/bảo hành|đổi trả|đổi hàng|trả hàng/.test(text))
      return "Dạ, bạn vui lòng gửi mã đơn và mô tả tình trạng sản phẩm để bộ phận bảo hành hỗ trợ ạ.";
    if (/khiếu nại|lừa đảo|tranh chấp/.test(text))
      return "Dạ, yêu cầu của bạn đã được ghi nhận ưu tiên. Vui lòng gửi mã đơn và thông tin liên quan để chúng tôi kiểm tra ạ.";
    return "Dạ, Admin đã nhận được tin nhắn của bạn. Bạn vui lòng mô tả chi tiết nội dung cần hỗ trợ ạ.";
  }
}
