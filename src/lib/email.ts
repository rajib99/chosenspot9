import { Resend } from "resend";

const from = process.env.EMAIL_FROM || "ChosenSpot <onboarding@resend.dev>";

export async function sendEmail({ to, subject, html }: { to: string | string[]; subject: string; html: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Dev fallback: no Resend key configured, print the email so flows stay testable.
    console.log(`\n[email:dev] to=${Array.isArray(to) ? to.join(",") : to}\n[email:dev] subject=${subject}\n[email:dev] ${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}\n`);
    return { ok: true, dev: true };
  }
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({ from, to, subject, html });
    if (error) {
      console.error("[email] send failed", error);
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.error("[email] send threw", e);
    return { ok: false };
  }
}

export function emailLayout(title: string, body: string) {
  return `<div style="font-family:Inter,Arial,sans-serif;background:#faf7f2;padding:32px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e6dfd2;border-radius:16px;padding:32px;color:#1f1d1a">
    <p style="font-family:Georgia,serif;font-size:22px;margin:0 0 20px">Chosen<span style="color:#0f5d4a">Spot</span></p>
    <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 16px">${title}</h1>
    <div style="font-size:15px;line-height:1.6;color:#4a4640">${body}</div>
  </div></div>`;
}

export function emailButton(href: string, label: string) {
  return `<p style="margin:24px 0"><a href="${href}" style="background:#0f5d4a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600">${label}</a></p>`;
}
