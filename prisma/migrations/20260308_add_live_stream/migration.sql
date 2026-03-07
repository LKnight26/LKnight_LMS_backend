-- CreateTable
CREATE TABLE "LiveStream" (
    "id" TEXT NOT NULL,
    "muxLiveStreamId" TEXT NOT NULL,
    "playbackId" TEXT NOT NULL,
    "streamKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "title" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveStream_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LiveStream_muxLiveStreamId_key" ON "LiveStream"("muxLiveStreamId");

-- CreateIndex
CREATE INDEX "LiveStream_createdById_idx" ON "LiveStream"("createdById");

-- CreateIndex
CREATE INDEX "LiveStream_status_idx" ON "LiveStream"("status");

-- AddForeignKey
ALTER TABLE "LiveStream" ADD CONSTRAINT "LiveStream_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
