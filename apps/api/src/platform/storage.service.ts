import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma.service";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

@Injectable()
export class StorageService implements OnModuleInit {
  readonly bucket = process.env.S3_BUCKET ?? "marketplace";
  private readonly client = new S3Client({
    region: process.env.S3_REGION ?? "us-east-1",
    endpoint: process.env.S3_ENDPOINT ?? "http://localhost:9000",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? "marketplace",
      secretAccessKey:
        process.env.S3_SECRET_KEY ?? "marketplace-local-secret",
    },
  });

  constructor(private readonly db: PrismaService) {}

  async onModuleInit() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      } catch (error) {
        console.warn("Object storage is not ready:", (error as Error).message);
      }
    }
  }

  async health() {
    await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    return "up";
  }

  async createUpload(userId: string, input: any) {
    const mimeType = String(input.mimeType ?? "").toLowerCase();
    const sizeBytes = Number(input.sizeBytes ?? 0);
    if (!ALLOWED_MIME.has(mimeType))
      throw new BadRequestException({
        code: "UNSUPPORTED_MEDIA_TYPE",
        message: "Chỉ hỗ trợ JPEG, PNG, WebP, GIF hoặc PDF",
      });
    const maxBytes = Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024);
    if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > maxBytes)
      throw new BadRequestException({
        code: "INVALID_FILE_SIZE",
        message: `Kích thước tệp phải từ 1 đến ${maxBytes} byte`,
      });
    const extension: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "application/pdf": "pdf",
    };
    const objectKey = `${userId}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension[mimeType]}`;
    const purpose = String(input.purpose ?? "PRODUCT").toUpperCase();
    const isPublic = ["PRODUCT", "SHOP", "REVIEW"].includes(purpose);
    const cacheControl = isPublic ? "public, max-age=31536000, immutable" : "private, no-store";
    const media = await this.db.mediaObject.create({
      data: {
        ownerId: userId,
        objectKey,
        bucket: this.bucket,
        purpose,
        mimeType,
        sizeBytes,
        checksum: input.checksum ? String(input.checksum) : null,
        entityType: input.entityType ? String(input.entityType) : null,
        entityId: input.entityId || null,
      },
    });
    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        ContentType: mimeType,
        ContentLength: sizeBytes,
        CacheControl: cacheControl,
      }),
      { expiresIn: 10 * 60 },
    );
    return {
      id: media.id,
      uploadUrl,
      method: "PUT",
      headers: { "Content-Type": mimeType, "Cache-Control": cacheControl },
      expiresInSeconds: 600,
    };
  }

  async complete(userId: string, id: string) {
    const media = await this.owned(userId, id);
    let head;
    try {
      head = await this.client.send(
        new HeadObjectCommand({ Bucket: media.bucket, Key: media.objectKey }),
      );
    } catch {
      throw new BadRequestException({
        code: "UPLOAD_NOT_FOUND",
        message: "Tệp chưa được tải lên object storage",
      });
    }
    if (Number(head.ContentLength ?? 0) !== media.sizeBytes)
      throw new BadRequestException({
        code: "UPLOAD_SIZE_MISMATCH",
        message: "Kích thước tệp không khớp",
      });
    const cdnBase = process.env.CDN_PUBLIC_BASE_URL?.replace(/\/$/, "");
    const publicUrl = ["PRODUCT", "SHOP", "REVIEW"].includes(media.purpose) && cdnBase
      ? `${cdnBase}/${media.objectKey}`
      : `/api/v1/media/${media.id}/content`;
    return this.db.mediaObject.update({
      where: { id },
      data: { status: "READY", completedAt: new Date(), publicUrl },
    });
  }

  async get(id: string) {
    const media = await this.db.mediaObject.findUnique({ where: { id } });
    if (!media || media.status !== "READY") throw new NotFoundException();
    return media;
  }

  async content(id: string) {
    const media = await this.get(id);
    if (!["PRODUCT", "SHOP", "REVIEW"].includes(media.purpose))
      throw new NotFoundException();
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: media.bucket, Key: media.objectKey }),
    );
    return { media, result };
  }

  async accessUrl(userId: string, roles: string[], id: string) {
    const media = await this.get(id);
    const admin = roles.some((role) => ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(role));
    if (media.ownerId !== userId && !admin) throw new NotFoundException();
    return {
      url: await getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: media.bucket, Key: media.objectKey }),
        { expiresIn: 5 * 60 },
      ),
      expiresInSeconds: 300,
    };
  }

  async remove(userId: string, id: string) {
    const media = await this.owned(userId, id);
    await this.client.send(
      new DeleteObjectCommand({ Bucket: media.bucket, Key: media.objectKey }),
    );
    await this.db.mediaObject.delete({ where: { id } });
    return { deleted: true };
  }

  private async owned(userId: string, id: string) {
    const media = await this.db.mediaObject.findFirst({
      where: { id, ownerId: userId },
    });
    if (!media) throw new NotFoundException();
    return media;
  }
}
