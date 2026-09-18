import { SiteHeader } from "@/components/site-header";
import { DashboardNav } from "@/components/dashboard-nav";
import { requireAdminPage } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_1fr]">
          <aside className="min-w-0">
            <p className="mb-3 hidden px-4 font-serif text-lg lg:block">Admin</p>
            <DashboardNav items={[
              { href: "/admin", label: "Overview", exact: true }, { href: "/admin/restaurants", label: "Restaurants" }, { href: "/admin/bookings", label: "Bookings" },
              { href: "/admin/coupons", label: "Coupons" }, { href: "/admin/users", label: "Users" }, { href: "/admin/settings", label: "Settings" }, { href: "/admin/audit", label: "Audit log" },
            ]} />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
