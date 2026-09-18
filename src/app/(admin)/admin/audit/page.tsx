import { prisma } from "@/lib/prisma";

export const metadata = { title: "Admin · Audit log" };
export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({ include: { actor: { select: { email: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold">Audit log</h1>
      <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-soft">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-muted"><tr><th className="px-4 py-3">When (UTC)</th><th className="px-4 py-3">Admin</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Details</th></tr></thead>
          <tbody>
            {logs.map((l) => <tr key={l.id} className="border-b border-line last:border-0"><td className="px-4 py-3 whitespace-nowrap text-ink-soft">{l.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td><td className="px-4 py-3">{l.actor.email}</td><td className="px-4 py-3 font-mono text-xs">{l.action}</td><td className="px-4 py-3 text-ink-soft">{l.entityType} {l.entityId.slice(-6)} {l.meta ? JSON.stringify(l.meta).slice(0, 90) : ""}</td></tr>)}
            {logs.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-ink-soft">No admin actions recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
