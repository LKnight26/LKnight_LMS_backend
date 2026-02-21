-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "stripePaymentId" TEXT,
ADD COLUMN     "stripeSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_stripeSessionId_key" ON "Enrollment"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_stripePaymentId_key" ON "Enrollment"("stripePaymentId");

-- CreateIndex
CREATE INDEX "Enrollment_stripeSessionId_idx" ON "Enrollment"("stripeSessionId");
