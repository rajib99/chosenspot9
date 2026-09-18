import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/auth-forms";

export const metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your reservations or your restaurant."
      footer={<>New here? <Link href="/signup" className="font-medium text-emerald hover:underline">Create an account</Link> · <Link href="/signup/restaurant" className="font-medium text-emerald hover:underline">List your restaurant</Link></>}
    >
      <LoginForm googleEnabled={!!process.env.GOOGLE_CLIENT_ID} callbackUrl={searchParams.callbackUrl} />
    </AuthShell>
  );
}
