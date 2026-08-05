-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "placeName" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "emoji" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "amountSpent" DOUBLE PRECISION,
    "spendCategory" TEXT,
    "isWorkout" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "trackerName" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckIn_timestamp_idx" ON "CheckIn"("timestamp");
