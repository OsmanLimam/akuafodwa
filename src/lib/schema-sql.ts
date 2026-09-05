// AUTO-GENERATED from prisma/schema.prisma — do not edit by hand.
// Regenerate with: bun scripts/gen-schema-sql.ts
//
// Idempotent Postgres DDL. Lets a fresh host (e.g. a brand-new Neon database
// on Vercel) build the full schema on first use; running it again is a no-op.
// - Tables/indexes use IF NOT EXISTS.
// - Foreign keys are wrapped in DO blocks that check pg_constraint, because
//   Postgres has no ADD CONSTRAINT IF NOT EXISTS.
// Statements are pre-split (dollar-quote aware); src/lib/bootstrap.ts runs
// them one by one via $executeRawUnsafe.

export const SCHEMA_TABLES: string[] = [
  'User',
  'Session',
  'Category',
  'Listing',
  'ListingImage',
  'OfferThread',
  'OfferMessage',
  'Review',
  'Favorite',
  'Report',
  'RateLimit',
  'AuditLog',
  'PushSubscription',
  'StoredFile',
]

export const SCHEMA_STATEMENTS: string[] = [
  `CREATE SCHEMA IF NOT EXISTS "public";`,

  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "sellerType" TEXT,
    "businessName" TEXT,
    "bio" TEXT,
    "profileImage" TEXT,
    "identityStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "idDocumentType" TEXT,
    "idDocumentPath" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);`,

  `CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);`,

  `CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);`,

  `CREATE TABLE IF NOT EXISTS "Listing" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "priceNegotiable" BOOLEAN NOT NULL DEFAULT true,
    "region" TEXT NOT NULL,
    "city" TEXT,
    "grade" TEXT,
    "packaging" TEXT,
    "harvestInfo" TEXT,
    "productionMethod" TEXT,
    "minOrder" DOUBLE PRECISION,
    "fulfillment" TEXT NOT NULL DEFAULT 'PICKUP',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "sellerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);`,

  `CREATE TABLE IF NOT EXISTS "ListingImage" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ListingImage_pkey" PRIMARY KEY ("id")
);`,

  `CREATE TABLE IF NOT EXISTS "OfferThread" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferThread_pkey" PRIMARY KEY ("id")
);`,

  `CREATE TABLE IF NOT EXISTS "OfferMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'MESSAGE',
    "quantity" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferMessage_pkey" PRIMARY KEY ("id")
);`,

  `CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);`,

  `CREATE TABLE IF NOT EXISTS "Favorite" (
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId","listingId")
);`,

  `CREATE TABLE IF NOT EXISTS "Report" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);`,

  `CREATE TABLE IF NOT EXISTS "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);`,

  `CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);`,

  `CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);`,

  `CREATE TABLE IF NOT EXISTS "StoredFile" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`,

  `CREATE INDEX IF NOT EXISTS "User_identityStatus_createdAt_idx" ON "User"("identityStatus", "createdAt");`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "Session_token_key" ON "Session"("token");`,

  `CREATE INDEX IF NOT EXISTS "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");`,

  `CREATE INDEX IF NOT EXISTS "Listing_status_createdAt_idx" ON "Listing"("status", "createdAt");`,

  `CREATE INDEX IF NOT EXISTS "Listing_status_isPremium_createdAt_idx" ON "Listing"("status", "isPremium", "createdAt");`,

  `CREATE INDEX IF NOT EXISTS "Listing_sellerId_status_idx" ON "Listing"("sellerId", "status");`,

  `CREATE INDEX IF NOT EXISTS "Listing_categoryId_status_idx" ON "Listing"("categoryId", "status");`,

  `CREATE INDEX IF NOT EXISTS "Listing_region_status_idx" ON "Listing"("region", "status");`,

  `CREATE INDEX IF NOT EXISTS "OfferThread_listingId_idx" ON "OfferThread"("listingId");`,

  `CREATE INDEX IF NOT EXISTS "OfferThread_buyerId_updatedAt_idx" ON "OfferThread"("buyerId", "updatedAt");`,

  `CREATE INDEX IF NOT EXISTS "OfferThread_sellerId_updatedAt_idx" ON "OfferThread"("sellerId", "updatedAt");`,

  `CREATE INDEX IF NOT EXISTS "OfferMessage_threadId_createdAt_idx" ON "OfferMessage"("threadId", "createdAt");`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "Review_threadId_key" ON "Review"("threadId");`,

  `CREATE INDEX IF NOT EXISTS "Favorite_listingId_idx" ON "Favorite"("listingId");`,

  `CREATE INDEX IF NOT EXISTS "Report_status_createdAt_idx" ON "Report"("status", "createdAt");`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "Report_listingId_reporterId_key" ON "Report"("listingId", "reporterId");`,

  `CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");`,

  `DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "Session_userId_fkey") THEN
        ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;`,

  `DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "Listing_sellerId_fkey") THEN
        ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;`,

  `DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "Listing_categoryId_fkey") THEN
        ALTER TABLE "Listing" ADD CONSTRAINT "Listing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;`,

  `DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "ListingImage_listingId_fkey") THEN
        ALTER TABLE "ListingImage" ADD CONSTRAINT "ListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;`,

  `DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "OfferThread_listingId_fkey") THEN
        ALTER TABLE "OfferThread" ADD CONSTRAINT "OfferThread_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;`,

  `DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "OfferThread_buyerId_fkey") THEN
        ALTER TABLE "OfferThread" ADD CONSTRAINT "OfferThread_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;`,

  `DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "OfferThread_sellerId_fkey") THEN
        ALTER TABLE "OfferThread" ADD CONSTRAINT "OfferThread_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;`,

  `DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "OfferMessage_threadId_fkey") THEN
        ALTER TABLE "OfferMessage" ADD CONSTRAINT "OfferMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "OfferThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;`,

  `DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "OfferMessage_senderId_fkey") THEN
        ALTER TABLE "OfferMessage" ADD CONSTRAINT "OfferMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;`,

  `DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "Review_threadId_fkey") THEN
        ALTER TABLE "Review" ADD CONSTRAINT "Review_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "OfferThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;`,

  `DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "Review_sellerId_fkey") THEN
        ALTER TABLE "Review" ADD CONSTRAINT "Review_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;`,

  `DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "Review_buyerId_fkey") THEN
        ALTER TABLE "Review" ADD CONSTRAINT "Review_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;`,

  `DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "Favorite_userId_fkey") THEN
        ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;`,

  `DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "Favorite_listingId_fkey") THEN
        ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;`,

  `DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "Report_listingId_fkey") THEN
        ALTER TABLE "Report" ADD CONSTRAINT "Report_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;`,

  `DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "Report_reporterId_fkey") THEN
        ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;`,

  `DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "PushSubscription_userId_fkey") THEN
        ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;`,
]
