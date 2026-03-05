import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function buildCloudSqlUrlFromEnv() {
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;
  const socket = process.env.DB_SOCKET;

  if (!user || !password || !dbName || !socket) return undefined;

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  const encodedDbName = encodeURIComponent(dbName);
  const encodedSocket = encodeURIComponent(socket);
  return `postgresql://${encodedUser}:${encodedPassword}@localhost/${encodedDbName}?host=${encodedSocket}`;
}

const resolvedDatabaseUrl = process.env.DATABASE_URL ?? buildCloudSqlUrlFromEnv();

const prismaClient = resolvedDatabaseUrl
  ? new PrismaClient({ datasources: { db: { url: resolvedDatabaseUrl } } })
  : new PrismaClient();

export const prisma = globalForPrisma.prisma ?? prismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
