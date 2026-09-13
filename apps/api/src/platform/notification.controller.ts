import { Controller, Get, Param, Patch, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { NotificationService } from "./notification.service";

@Controller("notifications")
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  list(@Req() req: any, @Query("unreadOnly") unreadOnly?: string) {
    return this.notifications.list(req.user.id, unreadOnly === "true");
  }

  @Patch("read-all")
  readAll(@Req() req: any) {
    return this.notifications.readAll(req.user.id);
  }

  @Patch(":id/read")
  read(@Req() req: any, @Param("id") id: string) {
    return this.notifications.read(req.user.id, id);
  }
}
