import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserActions } from "@/components/admin-actions";

export const metadata = { title: "Admin · Users" };
export const dynamic = "force-dynamic";

export default async function AdminUsers({ searchParams }: { searchParams: { q?: string } }) {
  const me = (await getSession())!.user;
  const users = await prisma.user.findMany({ where: searchParams.q ? { OR: [{ email: { contains: searchParams.q, mode: "insensitive" } }, { name: { contains: searchParams.q, mode: "insensitive" } }] } : {}, orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold">Users</h1>
      <form className="mb-5 flex max-w-md gap-2" role="search"><Input name="q" placeholder="Search name or email" defaultValue={searchParams.q} /><Button type="submit">Search</Button></form>
      <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-soft">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-muted"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Role &amp; actions</th></tr></thead>
          <tbody>{users.map((u) => (
            <tr key={u.id} className="border-b border-line last:border-0">
              <td className="px-4 py-3"><div className="font-medium">{u.name ?? "—"}</div><div className="text-ink-muted">{u.email}</div></td>
              <td className="px-4 py-3 text-ink-soft">{u.createdAt.toISOString().slice(0, 10)}</td>
              <td className="px-4 py-3">{u.suspended ? <Badge variant="danger">Suspended</Badge> : <Badge variant="success">Active</Badge>}</td>
              <td className="px-4 py-3"><UserActions id={u.id} role={u.role} suspended={u.suspended} isSelf={u.id === me.id} /></td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}
