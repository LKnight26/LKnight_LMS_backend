-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "bunnyLibraryId" TEXT,
ADD COLUMN     "bunnyVideoId" TEXT,
ADD COLUMN     "thumbnailUrl" TEXT,
ADD COLUMN     "videoStatus" TEXT DEFAULT 'none';

-- CreateIndex
CREATE INDEX "Lesson_bunnyVideoId_idx" ON "Lesson"("bunnyVideoId");
