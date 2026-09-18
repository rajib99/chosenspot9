import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ResetForm } from "@/components/auth-forms";

export const metadata = { title: "Choose a new password" };

export default function ResetPage({ searchParams }: { searchParams: { token?: string } }) {
  return (
    <AuthShell title="Choose a new password">
      {searchParams.token ? (
        <ResetForm token={searchParams.token} />
      ) : (
        <p className="text-sm text-ink-soft">This link is missing its token. <Link href="/forgot-password" className="text-emerald underline">Request a new one</Link>.</p>
      )}
    </AuthShell>
  );
}
