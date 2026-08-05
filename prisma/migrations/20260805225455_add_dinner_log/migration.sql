-- CreateTable
CREATE TABLE "DinnerLog" (
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "DinnerLog_pkey" PRIMARY KEY ("date")
);
