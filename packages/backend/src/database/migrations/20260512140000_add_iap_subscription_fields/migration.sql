-- AlterTable: Subscription — extend for Apple IAP support
ALTER TABLE "Subscription"
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'stripe',
  ADD COLUMN "iosOriginalTransactionId" TEXT,
  ADD COLUMN "iosLatestTransactionId" TEXT,
  ADD COLUMN "iosProductId" TEXT;

-- Make Stripe-specific columns nullable (Apple IAP subs won't have them).
ALTER TABLE "Subscription" ALTER COLUMN "stripeSubscriptionId" DROP NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "stripePriceId" DROP NOT NULL;

-- Unique index for iOS original transaction (one sub per Apple subscription).
CREATE UNIQUE INDEX "Subscription_iosOriginalTransactionId_key"
  ON "Subscription"("iosOriginalTransactionId");

-- Performance indexes for filtering active subs per user and per source.
CREATE INDEX "Subscription_userId_status_idx"
  ON "Subscription"("userId", "status");

CREATE INDEX "Subscription_source_status_idx"
  ON "Subscription"("source", "status");
