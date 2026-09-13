import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { rebuildProductIndex } from "./product-search";

config({ path: process.env.WORKER_ENV_FILE ?? "../api/.env" });
const db = new PrismaClient();

rebuildProductIndex(db)
  .then((count) => console.log(`Queued ${count} active products for search indexing`))
  .finally(() => db.$disconnect());
