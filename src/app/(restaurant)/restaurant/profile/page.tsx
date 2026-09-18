import { redirect } from "next/navigation";
import { getOwnerRestaurant } from "@/lib/owner";
import { RestaurantForm } from "@/components/restaurant-form";

export const metadata = { title: "Restaurant profile" };

export default async function ProfilePage() {
  const r = await getOwnerRestaurant();
  if (!r) redirect("/restaurant/onboarding");
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-3xl font-semibold">Profile</h1>
      <RestaurantForm
        mode="edit"
        initial={{ name: r.name, description: r.description, cuisine: r.cuisine, address: r.address, city: r.city, timezone: r.timezone, phone: r.phone ?? "", email: r.email ?? "", coverImageUrl: r.coverImageUrl ?? "", galleryImages: r.galleryImages }}
      />
    </div>
  );
}
