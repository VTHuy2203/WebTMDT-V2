import { ForbiddenException, Injectable } from "@nestjs/common";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { PrismaService } from "../prisma.service";
import { NotificationService } from "./notification.service";

@Injectable()
export class IdentityService {
  constructor(
    private readonly db: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  status(userId: string) {
    return this.db.identityVerification.findUnique({ where: { userId } });
  }

  async submit(userId: string, input: any) {
    const provider = String(process.env.KYC_PROVIDER ?? "LOCAL").toUpperCase();
    const idHash = input.idNumber
      ? createHash("sha256").update(String(input.idNumber)).digest("hex")
      : undefined;
    const safeData = {
      fullName: input.fullName,
      dateOfBirth: input.dateOfBirth,
      idNumberHash: idHash,
      frontMediaId: input.frontMediaId,
      backMediaId: input.backMediaId,
      selfieMediaId: input.selfieMediaId,
    };
    let externalId: string | undefined;
    let status = provider === "LOCAL" ? "UNDER_REVIEW" : "PENDING";
    if (provider !== "LOCAL" && process.env.KYC_API_URL) {
      const response = await fetch(`${process.env.KYC_API_URL}/verifications`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${process.env.KYC_API_TOKEN ?? ""}` },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error(`KYC provider returned ${response.status}`);
      const data: any = await response.json();
      externalId = data.id;
      status = String(data.status ?? status).toUpperCase();
    }
    return this.db.identityVerification.upsert({
      where: { userId },
      create: { userId, provider, externalId, status, submittedData: safeData },
      update: { provider, externalId, status, submittedData: safeData, submittedAt: new Date(), reviewedAt: null },
    });
  }

  async webhook(signature: string, rawBody: Buffer | undefined, input: any) {
    const secret = process.env.KYC_WEBHOOK_SECRET;
    if (!secret) throw new ForbiddenException({ code: "WEBHOOK_DISABLED", message: "KYC webhook chưa cấu hình" });
    const supplied = signature.replace(/^sha256=/, "");
    const expected = createHmac("sha256", secret).update(rawBody ?? Buffer.from(JSON.stringify(input))).digest("hex");
    if (supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected)))
      throw new ForbiddenException({ code: "INVALID_SIGNATURE", message: "Chữ ký webhook không hợp lệ" });
    const verification = await this.db.identityVerification.update({
      where: { externalId: String(input.verificationId) },
      data: { status: String(input.status).toUpperCase(), resultData: input.result ?? {}, reviewedAt: new Date() },
    });
    await this.notifications.create(verification.userId, "KYC_UPDATED", "Cập nhật xác minh danh tính", `Trạng thái xác minh: ${verification.status}`, { status: verification.status });
    return { accepted: true };
  }
}
