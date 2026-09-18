import { z } from "zod";

export const restaurantSchema = z.object({
  name: z.string().trim().min(2, "Enter the restaurant name").max(80),
  description: z.string().trim().min(20, "Tell guests a little more (20+ characters)").max(2000),
  cuisine: z.string().trim().min(2, "Enter a cuisine").max(40),
  address: z.string().trim().min(5, "Enter the street address").max(160),
  city: z.string().trim().min(2, "Enter the city").max(60),
  timezone: z.string().min(2),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  coverImageUrl: z.string().min(1, "Add a cover image"),
  galleryImages: z.array(z.string()).max(12),
});
export type RestaurantInput = z.infer<typeof restaurantSchema>;
