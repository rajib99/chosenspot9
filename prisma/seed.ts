import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { fromZonedTime } from "date-fns-tz";

const prisma = new PrismaClient();

async function user(email: string, name: string, role: "ADMIN" | "CUSTOMER" | "RESTAURANT_OWNER", password: string) {
  return prisma.user.upsert({ where: { email }, update: { role }, create: { email, name, role, passwordHash: await bcrypt.hash(password, 10) } });
}

const restaurants = [
  { slug: "casa-luna", name: "Casa Luna", cuisine: "Spanish", city: "Barcelona", tz: "Europe/Madrid", address: "Carrer de Provença 42", desc: "Sun-soaked Catalan tapas and wood-fired seafood, served beneath a canopy of lemon trees.", tables: [["Terrace Table 1", "TERRACE", 4, 0], ["Terrace Table 2", "TERRACE", 2, 0], ["Chef's Counter", "OTHER", 2, 30], ["VIP Alcove", "VIP", 6, 60]] },
  { slug: "maison-rose", name: "Maison Rosé", cuisine: "French", city: "Paris", tz: "Europe/Paris", address: "14 Rue de Turenne", desc: "A candle-lit bistro on the Left Bank with a tasting menu that changes weekly.", tables: [["Window Table 1", "WINDOW", 2, 15], ["Window Table 2", "WINDOW", 2, 15], ["Salon Privé", "VIP", 8, 80], ["Center Table", "CENTER", 4, 0]] },
  { slug: "kintsugi-house", name: "Kintsugi House", cuisine: "Japanese", city: "London", tz: "Europe/London", address: "9 Dean Street", desc: "Omakase counter and quiet tatami rooms, crafted with seasonal Japanese ingredients.", tables: [["Omakase Counter", "OTHER", 2, 45], ["Tatami Room", "VIP", 6, 70], ["Window Bar", "WINDOW", 2, 0]] },
  { slug: "the-copper-fig", name: "The Copper Fig", cuisine: "Modern American", city: "New York", tz: "America/New_York", address: "220 W 4th St", desc: "Farm-driven American cooking in a converted foundry with soaring ceilings.", tables: [["Rooftop Terrace 5", "TERRACE", 4, 20], ["Center Stage", "CENTER", 4, 0], ["Founder's Booth", "VIP", 5, 50]] },
] as const;

async function main() {
  const admin = await user("admin@chosenspot.test", "Site Admin", "ADMIN", "admin1234");
  const customer = await user("guest@chosenspot.test", "Ava Guest", "CUSTOMER", "guest1234");

  let i = 0;
  for (const r of restaurants) {
    const owner = await user(`owner-${r.slug}@chosenspot.test`, `${r.name} Owner`, "RESTAURANT_OWNER", "owner1234");
    const rest = await prisma.restaurant.upsert({
      where: { slug: r.slug },
      update: {},
      create: {
        slug: r.slug, name: r.name, description: r.desc, cuisine: r.cuisine, city: r.city, address: r.address, timezone: r.tz,
        ownerId: owner.id, status: "APPROVED", listingFeeStatus: "PAID", canAcceptPaid: true,
        email: `hello@${r.slug}.test`, phone: "+1 555 0100",
        coverImageUrl: `/seed/cover-${i % 8}.svg`, galleryImages: [`/seed/cover-${(i + 1) % 8}.svg`, `/seed/table-${(i + 2) % 8}.svg`, `/seed/table-${(i + 3) % 8}.svg`],
      },
    });
    for (const [j, [name, tag, cap, fee]] of r.tables.entries()) {
      const exists = await prisma.table.findFirst({ where: { restaurantId: rest.id, name } });
      if (!exists) {
        await prisma.table.create({
          data: { restaurantId: rest.id, name, locationTag: tag, capacity: cap, bookingFee: fee, currency: "usd", description: `${name} at ${r.name}: a favourite among regulars — request it by name and enjoy the best seat in the house.`, photos: [`/seed/table-${(i + j) % 8}.svg`, `/seed/cover-${(i + j + 1) % 8}.svg`] },
        });
      }
    }
    i++;
  }

  // Demo coupons
  await prisma.coupon.upsert({ where: { code: "WELCOME10" }, update: {}, create: { code: "WELCOME10", type: "PERCENT", value: 10, appliesTo: "ALL", maxRedemptions: 100 } });
  await prisma.coupon.upsert({ where: { code: "FIVEOFF" }, update: {}, create: { code: "FIVEOFF", type: "FIXED", value: 5, appliesTo: "ALL" } });

  // A few demo bookings (past + upcoming)
  const tables = await prisma.table.findMany({ include: { restaurant: true }, take: 6 });
  if ((await prisma.booking.count()) === 0) {
    for (const [k, t] of tables.entries()) {
      const offsetDays = k % 2 === 0 ? -(k + 2) : k + 1;
      const day = new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
      const startAt = fromZonedTime(`${day}T18:00:00`, t.restaurant.timezone);
      await prisma.booking.create({
        data: {
          tableId: t.id, customerId: customer.id, guestName: customer.name!, guestEmail: customer.email, startAt,
          date: day, startTime: "18:00", durationMinutes: 90, partySize: Math.min(2, t.capacity),
          status: offsetDays < 0 ? "COMPLETED" : "CONFIRMED", feeAmount: new Prisma.Decimal(t.bookingFee),
        },
      });
    }
  }

  // Approve the manually-created test restaurant, if present
  await prisma.restaurant.updateMany({ where: { listingFeeStatus: "PAID", status: "PENDING", owner: { email: "owner@test.com" } }, data: { status: "APPROVED" } });
  console.log("Seed complete. Logins: admin@chosenspot.test / admin1234, guest@chosenspot.test / guest1234, owner-casa-luna@chosenspot.test / owner1234");
  void admin;
}

main().finally(() => prisma.$disconnect());
