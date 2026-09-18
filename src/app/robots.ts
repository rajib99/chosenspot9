import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/restaurant", "/account", "/api", "/booking/", "/book/"] }], sitemap: `${appUrl()}/sitemap.xml` };
}
