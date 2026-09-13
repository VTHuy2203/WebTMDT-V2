import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { MessagingGateway } from "./messaging.gateway";
import { MessagingService } from "./messaging.service";

@Controller("conversations")
@UseGuards(AuthGuard)
export class MessagingController {
  constructor(
    private readonly messaging: MessagingService,
    private readonly gateway: MessagingGateway,
  ) {}

  @Get()
  list(@Req() req: any) {
    return this.messaging.list(req.user.id);
  }

  @Post("admin-support")
  support(@Req() req: any) {
    return this.messaging.adminSupport(req.user.id);
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.messaging.create(req.user.id, body);
  }

  @Get(":id/messages")
  messages(@Req() req: any, @Param("id") id: string, @Query("before") before?: string) {
    return this.messaging.messages(req.user.id, id, before);
  }

  @Post(":id/messages")
  async send(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    const result = await this.messaging.sendWithAutomation(req.user.id, id, body);
    const participantIds = await this.messaging.participantIds(id);
    for (const message of result.messages) {
      this.gateway.server?.to(`conversation:${id}`).emit("message.created", message);
      for (const userId of participantIds) {
        this.gateway.emitToUser(userId, "message.created", message);
        if (userId !== message.senderId)
          this.gateway.emitToUser(userId, "notification.created", { type: "NEW_MESSAGE", conversationId: id });
      }
    }
    return result.message;
  }

  @Patch(":id/read")
  read(@Req() req: any, @Param("id") id: string) {
    return this.messaging.markRead(req.user.id, id);
  }
}
