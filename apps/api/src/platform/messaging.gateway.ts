import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from "socket.io";
import { PrismaService } from "../prisma.service";
import { MessagingService } from "./messaging.service";

@WebSocketGateway({ namespace: "/chat", cors: { origin: true, credentials: true } })
export class MessagingGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly db: PrismaService,
    private readonly messaging: MessagingService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader = String(client.handshake.headers.authorization ?? "");
      const token = String(client.handshake.auth?.token ?? authHeader.replace(/^Bearer\s+/i, ""));
      const payload = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? "local-access-secret-change-me-32chars",
      });
      const session = await this.db.session.findUnique({ where: { id: payload.sid } });
      if (!session || session.revokedAt || session.expiresAt < new Date()) throw new Error("revoked");
      client.data.user = { id: payload.sub, roles: payload.roles ?? [] };
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage("conversation.join")
  async join(@ConnectedSocket() client: Socket, @MessageBody() input: any) {
    if (!client.data.user) throw new WsException("UNAUTHORIZED");
    await this.messaging.assertMember(client.data.user.id, String(input.conversationId));
    client.join(`conversation:${input.conversationId}`);
    return { ok: true };
  }

  @SubscribeMessage("message.send")
  async send(@ConnectedSocket() client: Socket, @MessageBody() input: any) {
    if (!client.data.user) throw new WsException("UNAUTHORIZED");
    const conversationId = String(input.conversationId);
    const result = await this.messaging.sendWithAutomation(client.data.user.id, conversationId, input);
    const participantIds = await this.messaging.participantIds(conversationId);
    for (const message of result.messages) {
      this.server.to(`conversation:${conversationId}`).emit("message.created", message);
      for (const userId of participantIds) {
        this.emitToUser(userId, "message.created", message);
        if (userId !== message.senderId)
          this.emitToUser(userId, "notification.created", { type: "NEW_MESSAGE", conversationId });
      }
    }
    return result.message;
  }

  @SubscribeMessage("typing")
  async typing(@ConnectedSocket() client: Socket, @MessageBody() input: any) {
    await this.messaging.assertMember(client.data.user?.id, String(input.conversationId));
    client.to(`conversation:${input.conversationId}`).emit("typing", {
      conversationId: input.conversationId,
      userId: client.data.user.id,
      active: Boolean(input.active),
    });
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }
}
