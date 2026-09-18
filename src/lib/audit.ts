import { prisma } from "@/lib/prisma";

export async function audit(actorId: string, action: string, entityType: string, entityId: string, meta?: Record<string, unknown>) {
  await prisma.auditLog.create({ data: { actorId, action, entityType, entityId, meta: meta as never } });
}
