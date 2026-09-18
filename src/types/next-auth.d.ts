import "next-auth";
import "next-auth/jwt";

type AppRole = "CUSTOMER" | "RESTAURANT_OWNER" | "ADMIN";

declare module "next-auth" {
  interface Session {
    user: { id: string; name?: string | null; email?: string | null; image?: string | null; role: AppRole; restaurantIds: string[] };
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    role?: AppRole;
    restaurantIds?: string[];
    invalid?: boolean;
  }
}
