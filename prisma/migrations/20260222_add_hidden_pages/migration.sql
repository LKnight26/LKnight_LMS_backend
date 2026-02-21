-- AlterTable
ALTER TABLE "Settings" ADD COLUMN "hiddenPages" TEXT[] DEFAULT ARRAY[]::TEXT[];
