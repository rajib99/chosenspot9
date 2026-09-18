import { z } from "zod";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM");

export const tableSchema = z
  .object({
    name: z.string().trim().min(2, "Give the table a name").max(60),
    description: z.string().trim().min(10, "Add a short description (10+ characters)").max(1500),
    locationTag: z.string().trim().min(2).max(30),
    capacity: z.coerce.number().int().min(1, "At least 1 guest").max(50),
    bookingFee: z.coerce.number().min(0, "Fee can't be negative").max(5000),
    photos: z.array(z.string()).max(10),
    isActive: z.boolean(),
    openDays: z.array(z.number().int().min(0).max(6)).min(1, "Pick at least one day"),
    openTime: hhmm,
    closeTime: hhmm,
    minDuration: z.coerce.number().int().min(15).max(600),
    maxDuration: z.coerce.number().int().min(15).max(600),
    bufferMinutes: z.coerce.number().int().min(0).max(240),
  })
  .refine((d) => d.openTime < d.closeTime, { message: "Closing time must be after opening time", path: ["closeTime"] })
  .refine((d) => d.minDuration <= d.maxDuration, { message: "Min duration can't exceed max", path: ["maxDuration"] });

export type TableInput = z.infer<typeof tableSchema>;
