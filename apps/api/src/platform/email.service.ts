import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private readonly transport = process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
          : undefined,
      })
    : null;

  async sendAccountLink(email: string, title: string, path: string, token: string) {
    const baseUrl = process.env.BUYER_WEB_URL ?? "http://localhost:3000";
    const link = `${baseUrl}${path}?token=${encodeURIComponent(token)}`;
    if (!this.transport) {
      if (process.env.NODE_ENV === "production")
        throw new ServiceUnavailableException({
          code: "EMAIL_NOT_CONFIGURED",
          message: "Dịch vụ email chưa được cấu hình",
        });
      console.info(JSON.stringify({ event: "development_email", to: email, title, link }));
      return;
    }
    await this.transport.sendMail({
      from: process.env.SMTP_FROM ?? "no-reply@marketplace.local",
      to: email,
      subject: title,
      text: `${title}: ${link}`,
      html: `<p>${title}</p><p><a href="${link}">${link}</a></p>`,
    });
  }
}
