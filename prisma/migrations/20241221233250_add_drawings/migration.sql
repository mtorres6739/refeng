-- CreateEnum
CREATE TYPE "DrawingStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Drawing" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "prize" TEXT NOT NULL,
    "prizeDetails" TEXT,
    "rules" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "drawDate" TIMESTAMP(3) NOT NULL,
    "minEntries" INTEGER NOT NULL,
    "maxEntries" INTEGER,
    "status" "DrawingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "winnerId" TEXT,

    CONSTRAINT "Drawing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrawingEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "drawingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "DrawingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Drawing_winnerId_key" ON "Drawing"("winnerId");

-- CreateIndex
CREATE INDEX "Drawing_orgId_idx" ON "Drawing"("orgId");

-- CreateIndex
CREATE INDEX "Drawing_createdById_idx" ON "Drawing"("createdById");

-- CreateIndex
CREATE INDEX "DrawingEntry_drawingId_idx" ON "DrawingEntry"("drawingId");

-- CreateIndex
CREATE INDEX "DrawingEntry_userId_idx" ON "DrawingEntry"("userId");

-- AddForeignKey
ALTER TABLE "Drawing" ADD CONSTRAINT "Drawing_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drawing" ADD CONSTRAINT "Drawing_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drawing" ADD CONSTRAINT "Drawing_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "DrawingEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawingEntry" ADD CONSTRAINT "DrawingEntry_drawingId_fkey" FOREIGN KEY ("drawingId") REFERENCES "Drawing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawingEntry" ADD CONSTRAINT "DrawingEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
