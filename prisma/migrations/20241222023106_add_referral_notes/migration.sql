/*
  Warnings:

  - You are about to drop the column `notes` on the `Referral` table. All the data in the column will be lost.
  - You are about to drop the `_OrganizationToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_OrganizationToUser" DROP CONSTRAINT "_OrganizationToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_OrganizationToUser" DROP CONSTRAINT "_OrganizationToUser_B_fkey";

-- AlterTable
ALTER TABLE "DrawingEntry" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "referenceId" TEXT;

-- AlterTable
ALTER TABLE "Referral" DROP COLUMN "notes";

-- DropTable
DROP TABLE "_OrganizationToUser";

-- CreateTable
CREATE TABLE "ReferralNote" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "referralId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ReferralNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReferralNote_referralId_idx" ON "ReferralNote"("referralId");

-- CreateIndex
CREATE INDEX "ReferralNote_userId_idx" ON "ReferralNote"("userId");

-- AddForeignKey
ALTER TABLE "ReferralNote" ADD CONSTRAINT "ReferralNote_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralNote" ADD CONSTRAINT "ReferralNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
