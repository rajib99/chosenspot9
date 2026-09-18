import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export async function requireAdminPage() {
  const s = await getSession();
  if (s?.user?.role !== "ADMIN") redirect("/login?callbackUrl=/admin");
  return s.user;
}

export async function adminOrNull() {
  const s = await getSession();
  return s?.user?.role === "ADMIN" ? s.user : null;
}
