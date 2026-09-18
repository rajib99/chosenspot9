import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { appUrl } from "@/lib/utils";
import { Providers } from "@/components/providers";

const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "ChosenSpot — Reserve the table you actually want", template: "%s · ChosenSpot" },
  description: "Book premium tables — the window seat, the terrace, the VIP corner — at the best restaurants.",
  openGraph: { type: "website", siteName: "ChosenSpot" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
