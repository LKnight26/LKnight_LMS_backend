-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "content" TEXT,
ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "content" TEXT,
ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accessAll" BOOLEAN NOT NULL DEFAULT false;
