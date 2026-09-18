import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const loginUrl = (from: string) => {
    const u = new URL("/login", req.url);
    u.searchParams.set("callbackUrl", from);
    return NextResponse.redirect(u);
  };

  if (token?.invalid) return loginUrl(pathname);

  if (pathname.startsWith("/restaurant")) {
    if (!token) return loginUrl(pathname);
    if (token.role !== "RESTAURANT_OWNER") return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/admin")) {
    if (!token) return loginUrl(pathname);
    if (token.role !== "ADMIN") return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/account") && !token) return loginUrl(pathname);
  return NextResponse.next();
}

// "/restaurant" (owner dashboard) is distinct from "/restaurants" (public browsing).
export const config = { matcher: ["/restaurant", "/restaurant/:path*", "/admin/:path*", "/admin", "/account/:path*", "/account"] };
