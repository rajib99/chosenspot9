import { AuthShell } from "@/components/auth-shell";
import { ForgotForm } from "@/components/auth-forms";

export const metadata = { title: "Forgot password" };

export default function ForgotPage() {
  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a link to choose a new one.">
      <ForgotForm />
    </AuthShell>
  );
}
