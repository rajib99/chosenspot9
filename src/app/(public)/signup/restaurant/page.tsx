import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/auth-forms";

export const metadata = { title: "List your restaurant" };

export default function OwnerSignupPage() {
  return (
    <AuthShell
      title="List your restaurant"
      subtitle="Create an owner account, then set up your profile and tables."
      footer={<>Already registered? <Link href="/login" className="font-medium text-emerald hover:underline">Sign in</Link></>}
    >
      <SignupForm role="RESTAURANT_OWNER" googleEnabled={!!process.env.GOOGLE_CLIENT_ID} />
    </AuthShell>
  );
}
