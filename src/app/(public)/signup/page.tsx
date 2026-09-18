import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/auth-forms";

export const metadata = { title: "Create your account" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Keep your bookings in one place."
      footer={<>Own a restaurant? <Link href="/signup/restaurant" className="font-medium text-emerald hover:underline">Sign up as an owner</Link> · <Link href="/login" className="font-medium text-emerald hover:underline">Sign in</Link></>}
    >
      <SignupForm role="CUSTOMER" googleEnabled={!!process.env.GOOGLE_CLIENT_ID} />
    </AuthShell>
  );
}
