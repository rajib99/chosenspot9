import { Card, CardBody } from "@/components/ui/card";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="container-page flex justify-center py-12 sm:py-20">
      <div className="w-full max-w-md">
        <h1 className="text-center text-3xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-2 text-center text-sm text-ink-soft">{subtitle}</p>}
        <Card className="mt-8"><CardBody>{children}</CardBody></Card>
        {footer && <p className="mt-6 text-center text-sm text-ink-soft">{footer}</p>}
      </div>
    </div>
  );
}
