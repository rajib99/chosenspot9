# ChosenSpot — premium table booking

Next.js 14 (App Router) · TypeScript · Prisma + Postgres · NextAuth · Stripe (Checkout + Connect) · Resend · Vercel Blob · Tailwind.

## Local development

```bash
npm install
cp .env.example .env        # then fill in values (see below)
npx prisma migrate dev      # creates the schema
npm run db:seed             # demo restaurants, tables, bookings, coupons, admin user
npm run dev                 # http://localhost:3000
```

Everything works locally **without** Stripe / Resend / Blob keys:

| Missing key | Local fallback (never active on Vercel/production) |
|---|---|
| `STRIPE_SECRET_KEY` | "Simulate payment" buttons for the listing fee and booking fees |
| `RESEND_API_KEY` | Emails are printed to the server console |
| `BLOB_READ_WRITE_TOKEN` | Images are written to `public/uploads/` |
| `GOOGLE_CLIENT_ID/SECRET` | Google button is hidden |

### Seeded logins (local only — do not seed production with these)
| Role | Email | Password |
|---|---|---|
| Admin | admin@chosenspot.test | admin1234 |
| Customer | guest@chosenspot.test | guest1234 |
| Owner | owner-casa-luna@chosenspot.test | owner1234 |

## Environment variables
See `.env.example` — every variable is documented there. Required on Vercel:
`DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_URL`,
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `BLOB_READ_WRITE_TOKEN`.
Optional: Google OAuth, `ADMIN_NOTIFY_EMAIL`, platform defaults (also editable in **Admin → Settings**).

## Database & Vercel serverless
* `DATABASE_URL` = **pooled** connection (Neon "pooled" host / PgBouncer, add `&pgbouncer=true`). Used by the app at runtime.
* `DIRECT_URL` = **direct** (non-pooled) connection. Used only by `prisma migrate deploy` during the build.
* The build script runs `prisma generate && prisma migrate deploy && next build`, so migrations apply on every deploy.
* Create the first admin in production by signing up normally, then run in the Neon SQL editor:
  `UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';`

## Stripe
1. Test-mode keys → `STRIPE_SECRET_KEY`. (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is reserved; hosted Checkout doesn't need it.)
2. Enable **Connect** (Express) in the Stripe dashboard.
3. Webhook endpoint: `https://<your-domain>/api/webhooks/stripe`, events:
   `checkout.session.completed`, `checkout.session.expired`, `payment_intent.succeeded`,
   `payment_intent.payment_failed`, `charge.refunded`, `account.updated`
   (for Connect, also tick **"Listen to events on Connected accounts"** for `account.updated`).
   Copy the signing secret → `STRIPE_WEBHOOK_SECRET`.
4. Local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` (prints a local `whsec_…`).

## Scripts
`npm run dev | build | start | lint`, `npm run db:migrate | db:deploy | db:seed`.
