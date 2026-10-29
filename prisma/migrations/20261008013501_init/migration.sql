-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('GUOKAO', 'SHENGKAO', 'SHIYE_DANWEI', 'JIAOSHI', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('DAILY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "avatar" TEXT,
    "examType" "ExamType",
    "examDate" TIMESTAMP(3),
    "signupDate" TIMESTAMP(3),
    "admitDate" TIMESTAMP(3),
    "interviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "TaskType" NOT NULL DEFAULT 'DAILY',
    "date" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TaskType" NOT NULL DEFAULT 'DAILY',
    "content" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_tasks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "daysOfWeek" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_task_completions" (
    "id" TEXT NOT NULL,
    "recurringTaskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "recurring_task_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idiom_wrongs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idiom_wrongs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idiom_searches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idiom_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_idioms" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "pinyin" TEXT,
    "explanation" TEXT,
    "similar" TEXT,
    "opposite" TEXT,
    "usage" TEXT,
    "example" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_idioms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "tasks_userId_type_idx" ON "tasks"("userId", "type");

-- CreateIndex
CREATE INDEX "tasks_userId_date_idx" ON "tasks"("userId", "date");

-- CreateIndex
CREATE INDEX "journals_userId_type_idx" ON "journals"("userId", "type");

-- CreateIndex
CREATE INDEX "journals_userId_date_idx" ON "journals"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "journals_userId_type_date_key" ON "journals"("userId", "type", "date");

-- CreateIndex
CREATE INDEX "recurring_tasks_userId_idx" ON "recurring_tasks"("userId");

-- CreateIndex
CREATE INDEX "recurring_task_completions_userId_date_idx" ON "recurring_task_completions"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "recurring_task_completions_recurringTaskId_date_key" ON "recurring_task_completions"("recurringTaskId", "date");

-- CreateIndex
CREATE INDEX "idiom_wrongs_userId_idx" ON "idiom_wrongs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "idiom_wrongs_userId_word_key" ON "idiom_wrongs"("userId", "word");

-- CreateIndex
CREATE INDEX "idiom_searches_userId_idx" ON "idiom_searches"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "idiom_searches_userId_word_key" ON "idiom_searches"("userId", "word");

-- CreateIndex
CREATE INDEX "custom_idioms_userId_idx" ON "custom_idioms"("userId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journals" ADD CONSTRAINT "journals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_tasks" ADD CONSTRAINT "recurring_tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_task_completions" ADD CONSTRAINT "recurring_task_completions_recurringTaskId_fkey" FOREIGN KEY ("recurringTaskId") REFERENCES "recurring_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_task_completions" ADD CONSTRAINT "recurring_task_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idiom_wrongs" ADD CONSTRAINT "idiom_wrongs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idiom_searches" ADD CONSTRAINT "idiom_searches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_idioms" ADD CONSTRAINT "custom_idioms_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
