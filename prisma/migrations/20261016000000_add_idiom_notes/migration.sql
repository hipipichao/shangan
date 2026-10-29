-- CreateTable
CREATE TABLE IF NOT EXISTS "idiom_notes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idiomId" TEXT,
    "customIdiomId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idiom_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "idiom_notes_userId_idiomId_key" ON "idiom_notes"("userId", "idiomId");
CREATE UNIQUE INDEX IF NOT EXISTS "idiom_notes_userId_customIdiomId_key" ON "idiom_notes"("userId", "customIdiomId");
CREATE INDEX IF NOT EXISTS "idiom_notes_userId_idx" ON "idiom_notes"("userId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idiom_notes_userId_fkey') THEN
        ALTER TABLE "idiom_notes" ADD CONSTRAINT "idiom_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idiom_notes_idiomId_fkey') THEN
        ALTER TABLE "idiom_notes" ADD CONSTRAINT "idiom_notes_idiomId_fkey" FOREIGN KEY ("idiomId") REFERENCES "idioms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idiom_notes_customIdiomId_fkey') THEN
        ALTER TABLE "idiom_notes" ADD CONSTRAINT "idiom_notes_customIdiomId_fkey" FOREIGN KEY ("customIdiomId") REFERENCES "custom_idioms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;