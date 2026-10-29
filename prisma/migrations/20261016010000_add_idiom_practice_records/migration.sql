-- CreateTable
CREATE TABLE IF NOT EXISTS "idiom_practice_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idiomId" TEXT,
    "customIdiomId" TEXT,
    "ease" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" TIMESTAMP(3),
    "lastGrade" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "idiom_practice_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "idiom_practice_records_userId_idiomId_key" ON "idiom_practice_records"("userId", "idiomId");
CREATE UNIQUE INDEX IF NOT EXISTS "idiom_practice_records_userId_customIdiomId_key" ON "idiom_practice_records"("userId", "customIdiomId");
CREATE INDEX IF NOT EXISTS "idiom_practice_records_userId_dueDate_idx" ON "idiom_practice_records"("userId", "dueDate");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idiom_practice_records_userId_fkey') THEN
        ALTER TABLE "idiom_practice_records" ADD CONSTRAINT "idiom_practice_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idiom_practice_records_idiomId_fkey') THEN
        ALTER TABLE "idiom_practice_records" ADD CONSTRAINT "idiom_practice_records_idiomId_fkey" FOREIGN KEY ("idiomId") REFERENCES "idioms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idiom_practice_records_customIdiomId_fkey') THEN
        ALTER TABLE "idiom_practice_records" ADD CONSTRAINT "idiom_practice_records_customIdiomId_fkey" FOREIGN KEY ("customIdiomId") REFERENCES "custom_idioms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;