-- CreateTable
CREATE TABLE "VaultDiscussion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "VaultDiscussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "VaultComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultLike" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "discussionId" TEXT,
    "commentId" TEXT,

    CONSTRAINT "VaultLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VaultDiscussion_userId_idx" ON "VaultDiscussion"("userId");
CREATE INDEX "VaultDiscussion_category_idx" ON "VaultDiscussion"("category");
CREATE INDEX "VaultDiscussion_createdAt_idx" ON "VaultDiscussion"("createdAt");

-- CreateIndex
CREATE INDEX "VaultComment_userId_idx" ON "VaultComment"("userId");
CREATE INDEX "VaultComment_discussionId_idx" ON "VaultComment"("discussionId");
CREATE INDEX "VaultComment_parentId_idx" ON "VaultComment"("parentId");
CREATE INDEX "VaultComment_createdAt_idx" ON "VaultComment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VaultLike_userId_discussionId_key" ON "VaultLike"("userId", "discussionId");
CREATE UNIQUE INDEX "VaultLike_userId_commentId_key" ON "VaultLike"("userId", "commentId");
CREATE INDEX "VaultLike_discussionId_idx" ON "VaultLike"("discussionId");
CREATE INDEX "VaultLike_commentId_idx" ON "VaultLike"("commentId");

-- AddForeignKey
ALTER TABLE "VaultDiscussion" ADD CONSTRAINT "VaultDiscussion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultComment" ADD CONSTRAINT "VaultComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VaultComment" ADD CONSTRAINT "VaultComment_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "VaultDiscussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VaultComment" ADD CONSTRAINT "VaultComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "VaultComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultLike" ADD CONSTRAINT "VaultLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VaultLike" ADD CONSTRAINT "VaultLike_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "VaultDiscussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VaultLike" ADD CONSTRAINT "VaultLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "VaultComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
