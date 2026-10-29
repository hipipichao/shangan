import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export interface ActiveStage {
  recruitmentId: string;
  title: string;
  stage: "registration" | "admissionTicket" | "writtenExam" | "interview";
  stageLabel: string;
  deadlineText: string;
  urgent: boolean;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatMd(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export async function getActiveStages(): Promise<ActiveStage[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const recruitments = await prisma.recruitment.findMany({
    where: { userId: user.id },
  });

  const now = new Date();
  const result: ActiveStage[] = [];

  for (const r of recruitments) {
    if (
      r.registrationStart &&
      r.registrationEnd &&
      now >= r.registrationStart &&
      now <= r.registrationEnd &&
      !r.registrationDone
    ) {
      result.push({
        recruitmentId: r.id,
        title: r.title,
        stage: "registration",
        stageLabel: "报名进行中",
        deadlineText: `截止 ${formatMd(r.registrationEnd)}`,
        urgent: isSameDay(r.registrationEnd, now),
      });
    }

    if (
      r.admissionTicketStart &&
      r.admissionTicketEnd &&
      now >= r.admissionTicketStart &&
      now <= r.admissionTicketEnd &&
      !r.admissionTicketDone
    ) {
      result.push({
        recruitmentId: r.id,
        title: r.title,
        stage: "admissionTicket",
        stageLabel: "准考证打印中",
        deadlineText: `截止 ${formatMd(r.admissionTicketEnd)}`,
        urgent: isSameDay(r.admissionTicketEnd, now),
      });
    }

    if (r.writtenExamDate && isSameDay(r.writtenExamDate, now) && !r.writtenExamDone) {
      result.push({
        recruitmentId: r.id,
        title: r.title,
        stage: "writtenExam",
        stageLabel: "今天笔试",
        deadlineText: formatMd(r.writtenExamDate),
        urgent: true,
      });
    }

    if (r.interviewDate && isSameDay(r.interviewDate, now) && !r.interviewDone) {
      result.push({
        recruitmentId: r.id,
        title: r.title,
        stage: "interview",
        stageLabel: "今天面试",
        deadlineText: formatMd(r.interviewDate),
        urgent: true,
      });
    }
  }

  return result;
}