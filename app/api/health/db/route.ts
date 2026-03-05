import { prisma } from "@/lib/db";
import { err, ok } from "@/lib/api";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok({ ok: true, db: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database check failed";
    return err(message, 500);
  }
}
