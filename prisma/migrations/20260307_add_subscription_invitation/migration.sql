-- CreateTable
CREATE TABLE "SubscriptionInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,

    CONSTRAINT "SubscriptionInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionInvitation_token_key" ON "SubscriptionInvitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionInvitation_subscriptionId_email_key" ON "SubscriptionInvitation"("subscriptionId", "email");

-- CreateIndex
CREATE INDEX "SubscriptionInvitation_subscriptionId_idx" ON "SubscriptionInvitation"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionInvitation_email_idx" ON "SubscriptionInvitation"("email");

-- CreateIndex
CREATE INDEX "SubscriptionInvitation_token_idx" ON "SubscriptionInvitation"("token");

-- CreateIndex
CREATE INDEX "SubscriptionInvitation_expiresAt_idx" ON "SubscriptionInvitation"("expiresAt");

-- AddForeignKey
ALTER TABLE "SubscriptionInvitation" ADD CONSTRAINT "SubscriptionInvitation_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionInvitation" ADD CONSTRAINT "SubscriptionInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
