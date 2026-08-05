-- AlterTable
ALTER TABLE "Settings" ADD COLUMN "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Settings_shareToken_key" ON "Settings"("shareToken");
