import { redirect } from "next/navigation";
import { getOwnerRestaurant } from "@/lib/owner";
import { RestaurantForm } from "@/components/restaurant-form";

export const metadata = { title: "Set up your restaurant" };

export default async function OnboardingPage() {
  if (await getOwnerRestaurant()) redirect("/restaurant");
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-semibold">Set up your restaurant</h1>
      <p className="mb-8 mt-2 text-ink-soft">Three quick steps, then a one-time listing fee to go live.</p>
      <RestaurantForm mode="create" />
    </div>
  );
}
