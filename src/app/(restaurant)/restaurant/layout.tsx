import { SiteHeader } from "@/components/site-header";
import { DashboardNav } from "@/components/dashboard-nav";
import { getOwnerRestaurant } from "@/lib/owner";

export default async function RestaurantLayout({ children }: { children: React.ReactNode }) {
  const restaurant = await getOwnerRestaurant();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-page py-8">
        {restaurant ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[210px_1fr]">
            <aside className="min-w-0">
              <p className="mb-3 hidden truncate px-4 font-serif text-lg lg:block">{restaurant.name}</p>
              <DashboardNav
                items={[
                  { href: "/restaurant", label: "Overview", exact: true },
                  { href: "/restaurant/tables", label: "Tables" },
                  { href: "/restaurant/bookings", label: "Bookings" },
                  { href: "/restaurant/coupons", label: "Coupons" },
                  { href: "/restaurant/payouts", label: "Payouts" },
                  { href: "/restaurant/profile", label: "Profile" },
                ]}
              />
            </aside>
            <div className="min-w-0">{children}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
