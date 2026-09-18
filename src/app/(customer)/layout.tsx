import { SiteHeader } from "@/components/site-header";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      {children}
    </div>
  );
}
