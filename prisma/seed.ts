/**
 * Demo data: ten well-known Manhattan restaurants.
 * NOTE: names and addresses are real, but descriptions, tables and prices are invented placeholders for demoing
 * the platform. These businesses are not affiliated with ChosenSpot. Replace before going live.
 * Photos: everything points at PLACEHOLDER; overwrite that file or upload real photos in the owner dashboard.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { fromZonedTime } from "date-fns-tz";

const prisma = new PrismaClient();
const PLACEHOLDER = "/seed/placeholder.svg";
const TZ = "America/New_York";

// [table name, location tag, capacity, fee in USD (0 = free)]
type T = [string, string, number, number];
const restaurants: { slug: string; name: string; cuisine: string; address: string; zip: string; desc: string; tables: T[] }[] = [
  { slug: "katzs-delicatessen", name: "Katz's Delicatessen", cuisine: "Jewish Deli", address: "205 E Houston St", zip: "10002", desc: "A Lower East Side landmark known for hand-carved pastrami on rye and a bustling, no-frills dining hall.", tables: [["Window Table 1", "WINDOW", 4, 0], ["Center Hall Table", "CENTER", 6, 0], ["Corner Booth", "VIP", 4, 15]] },
  { slug: "le-bernardin", name: "Le Bernardin", cuisine: "French Seafood", address: "155 W 51st St", zip: "10019", desc: "Refined French seafood and a serene, formal dining room in Midtown West.", tables: [["Window Table 2", "WINDOW", 2, 40], ["Main Dining Room", "CENTER", 4, 30], ["Chef's Table", "VIP", 6, 120], ["Lounge Bar", "Bar", 2, 0]] },
  { slug: "balthazar", name: "Balthazar", cuisine: "French Brasserie", address: "80 Spring St", zip: "10012", desc: "A lively SoHo brasserie with a classic Parisian look, raw bar and all-day menu.", tables: [["Window Banquette", "WINDOW", 4, 20], ["Center Room Table", "CENTER", 4, 0], ["Raw Bar Seat", "Bar", 2, 10], ["Back Corner Booth", "VIP", 6, 45]] },
  { slug: "gramercy-tavern", name: "Gramercy Tavern", cuisine: "Modern American", address: "42 E 20th St", zip: "10003", desc: "A warm Flatiron tavern with seasonal American cooking, a front tavern room and a formal dining room.", tables: [["Tavern Window Table", "WINDOW", 4, 0], ["Dining Room Table", "CENTER", 4, 25], ["Private Alcove", "VIP", 8, 80]] },
  { slug: "carbone", name: "Carbone", cuisine: "Italian-American", address: "181 Thompson St", zip: "10012", desc: "A Greenwich Village red-sauce classic with tableside service and a retro dining room.", tables: [["Window Table", "WINDOW", 2, 35], ["Center Floor Table", "CENTER", 4, 30], ["VIP Booth", "VIP", 6, 100]] },
  { slug: "joes-pizza", name: "Joe's Pizza", cuisine: "Pizzeria", address: "7 Carmine St", zip: "10014", desc: "The quintessential Greenwich Village slice shop, quick, casual and beloved.", tables: [["Window Counter", "WINDOW", 2, 0], ["Wall Table", "CENTER", 4, 0], ["Back Table", "Booth", 6, 5]] },
  { slug: "eleven-madison-park", name: "Eleven Madison Park", cuisine: "Fine Dining", address: "11 Madison Ave", zip: "10010", desc: "An elegant tasting-menu restaurant in a soaring Art Deco room facing Madison Square Park.", tables: [["Park View Window Table", "WINDOW", 2, 60], ["Center Room Table", "CENTER", 4, 50], ["Kitchen Table", "VIP", 6, 150]] },
  { slug: "union-square-cafe", name: "Union Square Cafe", cuisine: "New American", address: "101 E 19th St", zip: "10003", desc: "A neighborhood favorite offering relaxed New American dining near Union Square.", tables: [["Window Table 1", "WINDOW", 2, 0], ["Terrace Table", "TERRACE", 4, 15], ["Center Table", "CENTER", 4, 0], ["Chef's Counter", "Chef's Counter", 2, 30]] },
  { slug: "the-odeon", name: "The Odeon", cuisine: "French-American Brasserie", address: "145 W Broadway", zip: "10013", desc: "A Tribeca brasserie with a retro neon sign, classic bistro plates and a late-night crowd.", tables: [["Window Booth", "WINDOW", 4, 15], ["Sidewalk Terrace", "TERRACE", 4, 10], ["Center Table", "CENTER", 4, 0], ["Bar Seats", "Bar", 2, 0]] },
  { slug: "per-se", name: "Per Se", cuisine: "Contemporary American", address: "10 Columbus Circle, 4th Floor", zip: "10019", desc: "A polished tasting-menu restaurant above Columbus Circle, with views over Central Park.", tables: [["Park View Window Table", "WINDOW", 2, 75], ["Salon Table", "CENTER", 4, 60], ["Private Salon", "VIP", 8, 200]] },
];

async function user(email: string, name: string, role: "ADMIN" | "CUSTOMER" | "RESTAURANT_OWNER", password: string) {
  return prisma.user.upsert({ where: { email }, update: { role }, create: { email, name, role, passwordHash: await bcrypt.hash(password, 10) } });
}

/** Remove earlier demo/test restaurants that aren't in the current list (bookings block FK deletes, so clear them first). */
async function clearOldDemo() {
  const keep = restaurants.map((r) => r.slug);
  const old = await prisma.restaurant.findMany({ where: { slug: { notIn: keep }, owner: { OR: [{ email: { endsWith: "@chosenspot.test" } }, { email: "owner@test.com" }] } }, select: { id: true } });
  const ids = old.map((r) => r.id);
  if (!ids.length) return;
  const tables = { table: { restaurantId: { in: ids } } };
  await prisma.payment.deleteMany({ where: { OR: [{ restaurantId: { in: ids } }, { booking: tables }] } });
  await prisma.review.deleteMany({ where: { restaurantId: { in: ids } } });
  await prisma.booking.deleteMany({ where: tables });
  await prisma.restaurant.deleteMany({ where: { id: { in: ids } } }); // tables & coupons cascade
  await prisma.user.deleteMany({ where: { email: { startsWith: "owner-", endsWith: "@chosenspot.test" }, restaurants: { none: {} } } });
  console.log(`Removed ${ids.length} old demo restaurants`);
}

async function main() {
  await user("admin@chosenspot.test", "Site Admin", "ADMIN", "admin1234");
  const customer = await user("guest@chosenspot.test", "Ava Guest", "CUSTOMER", "guest1234");
  await clearOldDemo();

  for (const r of restaurants) {
    const owner = await user(`owner-${r.slug}@chosenspot.test`, `${r.name} Owner`, "RESTAURANT_OWNER", "owner1234");
    const data = { name: r.name, description: r.desc, cuisine: r.cuisine, city: "New York", address: `${r.address}, New York, NY ${r.zip}`, timezone: TZ, coverImageUrl: PLACEHOLDER, galleryImages: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER] };
    const rest = await prisma.restaurant.upsert({
      where: { slug: r.slug },
      update: data,
      create: { ...data, slug: r.slug, ownerId: owner.id, status: "APPROVED", listingFeeStatus: "PAID", canAcceptPaid: true },
    });
    const wanted = r.tables.map((t) => t[0]);
    await prisma.table.deleteMany({ where: { restaurantId: rest.id, name: { notIn: wanted }, bookings: { none: {} } } });
    for (const [name, tag, cap, fee] of r.tables) {
      const tdata = { locationTag: tag, capacity: cap, bookingFee: fee, currency: "usd", photos: [PLACEHOLDER], description: `${name} at ${r.name}. Sample table for demo purposes; request it by name for the seat you want.` };
      const exists = await prisma.table.findFirst({ where: { restaurantId: rest.id, name } });
      if (exists) await prisma.table.update({ where: { id: exists.id }, data: tdata });
      else await prisma.table.create({ data: { ...tdata, name, restaurantId: rest.id } });
    }
  }

  await prisma.coupon.upsert({ where: { code: "WELCOME10" }, update: {}, create: { code: "WELCOME10", type: "PERCENT", value: 10, appliesTo: "ALL", maxRedemptions: 100 } });
  await prisma.coupon.upsert({ where: { code: "FIVEOFF" }, update: {}, create: { code: "FIVEOFF", type: "FIXED", value: 5, appliesTo: "ALL" } });

  if ((await prisma.booking.count()) === 0) {
    const tables = await prisma.table.findMany({ include: { restaurant: true }, orderBy: { createdAt: "asc" } });
    const picks = [0, 3, 6, 9, 12, 15].map((i) => tables[i]).filter(Boolean);
    for (const [k, t] of picks.entries()) {
      const offsetDays = k % 2 === 0 ? -(k + 2) : k + 1;
      const day = new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
      await prisma.booking.create({
        data: {
          tableId: t.id, customerId: customer.id, guestName: customer.name!, guestEmail: customer.email,
          startAt: fromZonedTime(`${day}T19:00:00`, t.restaurant.timezone), date: day, startTime: "19:00", durationMinutes: 90, partySize: Math.min(2, t.capacity),
          status: offsetDays < 0 ? "COMPLETED" : "CONFIRMED", feeAmount: new Prisma.Decimal(t.bookingFee),
        },
      });
    }
  }
  console.log("Seed complete.");
}

main().finally(() => prisma.$disconnect());
