-- RenameTable
ALTER TABLE "DinnerLog" RENAME TO "DailyLog";

-- RenameColumn
ALTER TABLE "DailyLog" RENAME COLUMN "type" TO "dinnerType";

-- AlterTable
ALTER TABLE "DailyLog" ALTER COLUMN "dinnerType" DROP NOT NULL;
ALTER TABLE "DailyLog" ADD COLUMN "didNotLeaveHouse" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "DailyLog" ADD COLUMN "mood" INTEGER;
