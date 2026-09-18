import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/settings-form";

export const metadata = { title: "Admin · Settings" };
export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  return (<div><h1 className="mb-2 text-3xl font-semibold">Settings</h1><p className="mb-6 text-sm text-ink-soft">Changing the currency only affects new tables and fees; existing tables keep theirs.</p><SettingsForm initial={await getSettings()} /></div>);
}
