"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";

function GoogleButton({ callbackUrl, role, enabled }: { callbackUrl: string; role?: string; enabled: boolean }) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => {
          if (!enabled) return toast.error("Google sign-in isn't configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.");
          if (role) document.cookie = `signup_role=${role}; path=/; max-age=600; samesite=lax`;
          signIn("google", { callbackUrl });
        }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l4-3.1z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"/></svg>
        Continue with Google
      </Button>
      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-ink-muted">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>
    </>
  );
}

const loginSchema = z.object({ email: z.string().email("Enter a valid email"), password: z.string().min(1, "Enter your password") });

export function LoginForm({ googleEnabled, callbackUrl }: { googleEnabled: boolean; callbackUrl?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setBusy(true);
    const res = await signIn("credentials", { ...values, redirect: false });
    if (res?.error) {
      setBusy(false);
      toast.error("Incorrect email or password.");
      return;
    }
    const session = await fetch("/api/auth/session").then((r) => r.json());
    const role = session?.user?.role;
    const home = role === "ADMIN" ? "/admin" : role === "RESTAURANT_OWNER" ? "/restaurant" : "/account";
    router.push(callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : home);
    router.refresh();
  }

  return (
    <div>
      <GoogleButton enabled={googleEnabled} callbackUrl={callbackUrl || "/account"} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="mb-1.5 text-xs text-emerald hover:underline">Forgot password?</Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
          <FieldError message={errors.password?.message} />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
      </form>
    </div>
  );
}

const signupSchema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

export function SignupForm({ role, googleEnabled }: { role: "CUSTOMER" | "RESTAURANT_OWNER"; googleEnabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof signupSchema>>({ resolver: zodResolver(signupSchema) });
  const isOwner = role === "RESTAURANT_OWNER";
  const dest = isOwner ? "/restaurant/onboarding" : "/account";

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    setBusy(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, role }),
    });
    if (!res.ok) {
      setBusy(false);
      toast.error((await res.json().catch(() => null))?.error ?? "Could not create your account.");
      return;
    }
    const login = await signIn("credentials", { email: values.email, password: values.password, redirect: false });
    if (login?.error) {
      setBusy(false);
      router.push("/login");
      return;
    }
    toast.success("Welcome to ChosenSpot");
    router.push(dest);
    router.refresh();
  }

  return (
    <div>
      <GoogleButton enabled={googleEnabled} callbackUrl={dest} role={isOwner ? role : undefined} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="name">{isOwner ? "Your name" : "Full name"}</Label>
          <Input id="name" autoComplete="name" {...register("name")} />
          <FieldError message={errors.name?.message} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          <FieldError message={errors.password?.message} />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating account…" : isOwner ? "Create owner account" : "Create account"}</Button>
      </form>
    </div>
  );
}

export function ForgotForm() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>({
    resolver: zodResolver(z.object({ email: z.string().email("Enter a valid email") })),
  });
  if (sent) return <p className="rounded-xl bg-emerald-light p-4 text-sm text-emerald">If an account exists for that email, a reset link is on its way. Check your inbox.</p>;
  return (
    <form
      onSubmit={handleSubmit(async (v) => {
        setBusy(true);
        await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
        setSent(true);
      })}
      className="space-y-4"
      noValidate
    >
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} />
        <FieldError message={errors.email?.message} />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>Send reset link</Button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<{ password: string }>({
    resolver: zodResolver(z.object({ password: z.string().min(8, "At least 8 characters") })),
  });
  return (
    <form
      onSubmit={handleSubmit(async (v) => {
        setBusy(true);
        const res = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: v.password }) });
        if (!res.ok) {
          setBusy(false);
          toast.error((await res.json().catch(() => null))?.error ?? "Could not reset password.");
          return;
        }
        toast.success("Password updated. Please sign in.");
        router.push("/login");
      })}
      className="space-y-4"
      noValidate
    >
      <div>
        <Label htmlFor="password">New password</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        <FieldError message={errors.password?.message} />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>Update password</Button>
    </form>
  );
}
