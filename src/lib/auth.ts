import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email",
    credentials: { email: {}, password: {} },
    async authorize(credentials) {
      const email = credentials?.email?.toLowerCase().trim();
      const password = credentials?.password;
      if (!email || !password) return null;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash || user.suspended) return null;
      const ok = await bcrypt.compare(password, user.passwordHash);
      return ok ? { id: user.id, email: user.email, name: user.name } : null;
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/login" },
  providers,
  events: {
    // Google sign-ups can opt in to the owner role via a short-lived cookie set on /signup/restaurant.
    async createUser({ user }) {
      try {
        const role = cookies().get("signup_role")?.value;
        if (role === "RESTAURANT_OWNER") {
          await prisma.user.update({ where: { id: user.id }, data: { role: "RESTAURANT_OWNER" } });
        }
      } catch {}
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      if (token.sub) {
        const db = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, suspended: true, restaurants: { select: { id: true } } },
        });
        if (!db || db.suspended) return { ...token, invalid: true };
        token.role = db.role;
        token.restaurantIds = db.restaurants.map((r) => r.id);
        delete token.invalid;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.invalid) return { ...session, user: undefined } as never;
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as "CUSTOMER" | "RESTAURANT_OWNER" | "ADMIN";
        session.user.restaurantIds = (token.restaurantIds as string[]) ?? [];
      }
      return session;
    },
  },
};

export const getSession = () => getServerSession(authOptions);

export async function requireUser() {
  const s = await getSession();
  return s?.user?.id ? s.user : null;
}

export function homeForRole(role?: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "RESTAURANT_OWNER") return "/restaurant";
  return "/account";
}
