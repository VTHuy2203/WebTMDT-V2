import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { StorageService } from "./storage.service";

@Controller("media")
export class MediaController {
  constructor(private readonly storage: StorageService) {}

  @Post("presign")
  @UseGuards(AuthGuard)
  presign(@Req() req: any, @Body() body: any) {
    return this.storage.createUpload(req.user.id, body);
  }

  @Post(":id/complete")
  @UseGuards(AuthGuard)
  complete(@Req() req: any, @Param("id") id: string) {
    return this.storage.complete(req.user.id, id);
  }

  @Get(":id/content")
  async content(@Param("id") id: string, @Res() response: Response) {
    const { media, result } = await this.storage.content(id);
    response.setHeader("Content-Type", media.mimeType);
    response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    if (result.ContentLength)
      response.setHeader("Content-Length", String(result.ContentLength));
    const stream = result.Body as any;
    stream.pipe(response);
  }

  @Get(":id/access-url")
  @UseGuards(AuthGuard)
  accessUrl(@Req() req: any, @Param("id") id: string) {
    return this.storage.accessUrl(req.user.id, req.user.roles, id);
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  remove(@Req() req: any, @Param("id") id: string) {
    return this.storage.remove(req.user.id, id);
  }
}
