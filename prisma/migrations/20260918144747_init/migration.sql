-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'RESTAURANT_OWNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "RestaurantStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ListingFeeStatus" AS ENUM ('UNPAID', 'PAID');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "CouponScope" AS ENUM ('ALL', 'RESTAURANT', 'TABLE');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('BOOKING_FEE', 'LISTING_FEE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "cuisine" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "coverImageUrl" TEXT,
    "galleryImages" TEXT[],
    "status" "RestaurantStatus" NOT NULL DEFAULT 'PENDING',
    "listingFeeStatus" "ListingFeeStatus" NOT NULL DEFAULT 'UNPAID',
    "stripeAccountId" TEXT,
    "canAcceptPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Table" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "locationTag" TEXT NOT NULL DEFAULT 'CENTER',
    "photos" TEXT[],
    "capacity" INTEGER NOT NULL,
    "bookingFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "openDays" INTEGER[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6]::INTEGER[],
    "openTime" TEXT NOT NULL DEFAULT '17:00',
    "closeTime" TEXT NOT NULL DEFAULT '23:00',
    "minDuration" INTEGER NOT NULL DEFAULT 60,
    "maxDuration" INTEGER NOT NULL DEFAULT 180,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "customerId" TEXT,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "partySize" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "feeAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stripePaymentIntentId" TEXT,
    "couponId" TEXT,
    "cancelToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "appliesTo" "CouponScope" NOT NULL DEFAULT 'ALL',
    "restaurantId" TEXT,
    "tableId" TEXT,
    "maxRedemptions" INTEGER,
    "timesRedeemed" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "restaurantId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeSessionId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,
    "type" "PaymentType" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_slug_key" ON "Restaurant"("slug");

-- CreateIndex
CREATE INDEX "Restaurant_ownerId_idx" ON "Restaurant"("ownerId");

-- CreateIndex
CREATE INDEX "Restaurant_status_city_idx" ON "Restaurant"("status", "city");

-- CreateIndex
CREATE INDEX "Restaurant_cuisine_idx" ON "Restaurant"("cuisine");

-- CreateIndex
CREATE INDEX "Table_restaurantId_idx" ON "Table"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_cancelToken_key" ON "Booking"("cancelToken");

-- CreateIndex
CREATE INDEX "Booking_tableId_date_idx" ON "Booking"("tableId", "date");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- CreateIndex
CREATE INDEX "Booking_startAt_idx" ON "Booking"("startAt");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Payment_bookingId_idx" ON "Payment"("bookingId");

-- CreateIndex
CREATE INDEX "Payment_restaurantId_idx" ON "Payment"("restaurantId");

-- CreateIndex
CREATE INDEX "Payment_stripePaymentIntentId_idx" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Payment_status_type_idx" ON "Payment"("status", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_restaurantId_idx" ON "Review"("restaurantId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
