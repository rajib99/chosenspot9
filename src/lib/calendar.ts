const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");

export function buildIcs(b: { id: string; startAt: Date; durationMinutes: number; summary: string; location: string; description: string }) {
  const end = new Date(b.startAt.getTime() + b.durationMinutes * 60_000);
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ChosenSpot//Booking//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT", `UID:${b.id}@chosenspot`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(b.startAt)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(b.summary)}`, `LOCATION:${esc(b.location)}`, `DESCRIPTION:${esc(b.description)}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}
