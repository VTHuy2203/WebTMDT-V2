import { BadRequestException } from "@nestjs/common";

export function requireText(value: unknown, field: string, min = 1): string {
  if (typeof value !== "string" || value.trim().length < min)
    throw new BadRequestException({
      code: "VALIDATION_ERROR",
      message: `${field} không hợp lệ`,
    });
  return value.trim();
}

export function publicUser(user: any) {
  const roles = (user.roles ?? []).map((x: any) => x.role?.key ?? x);
  const priority = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "SELLER_OWNER", "SELLER_MANAGER", "BUYER"];
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.emailNormalized,
    phoneNumber: user.phoneNormalized,
    status: user.status,
    roles,
    role: priority.find((role) => roles.includes(role)) ?? roles[0] ?? "BUYER",
    isEmailVerified: Boolean(user.emailVerifiedAt),
    createdAt: user.createdAt?.toISOString?.() ?? user.createdAt,
  };
}

export function allowedOrderActions(status: string) {
  const actions = ["CONTACT_SELLER"];
  if (status === "PENDING_PAYMENT") actions.push("PAY", "CANCEL");
  if (["READY_TO_SHIP", "SHIPPING", "DELIVERED"].includes(status)) actions.push("TRACK_SHIPPING");
  if (status === "DELIVERED") actions.push("CONFIRM_DELIVERED", "REQUEST_RETURN");
  if (status === "COMPLETED") actions.push("REQUEST_RETURN", "REQUEST_WARRANTY", "REVIEW");
  return actions;
}
