import Link from "next/link";
import { Plus, ExternalLink, Calendar, Trash2, Pencil } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StageCheckbox } from "@/components/recruitment-stage-checkbox";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toISOString().slice(0, 10);
}

function formatDateRange(start: Date | null, end: Date | null): string {
  if (!start && !end) return "—";
  return `${formatDate(start)} ~ ${formatDate(end)}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface StageBadge {
  label: string;
  className: string;
}

function getCurrentStage(r: {
  registrationStart: Date | null;
  registrationEnd: Date | null;
  admissionTicketStart: Date | null;
  admissionTicketEnd: Date | null;
  writtenExamDate: Date | null;
  interviewDate: Date | null;
}): StageBadge | null {
  const now = new Date();

  if (
    r.interviewDate &&
    isSameDay(r.interviewDate, now)
  ) {
    return { label: "面试中", className: "bg-purple-100 text-purple-700" };
  }

  if (
    r.writtenExamDate &&
    isSameDay(r.writtenExamDate, now)
  ) {
    return { label: "笔试中", className: "bg-blue-100 text-blue-700" };
  }

  if (
    r.admissionTicketStart &&
    r.admissionTicketEnd &&
    now >= r.admissionTicketStart &&
    now <= r.admissionTicketEnd
  ) {
    return { label: "准考证打印中", className: "bg-indigo-100 text-indigo-700" };
  }

  if (
    r.registrationStart &&
    r.registrationEnd &&
    now >= r.registrationStart &&
    now <= r.registrationEnd
  ) {
    return { label: "报名中", className: "bg-emerald-100 text-emerald-700" };
  }

  return null;
}

export default async function RecruitmentsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <h1 className="text-xl font-semibold">请先登录</h1>
      </div>
    );
  }

  const recruitments = await prisma.recruitment.findMany({
    where: { userId: user.id },
    orderBy: [{ registrationEnd: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            报考日程
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            不错过每一次报名与考试机会
          </p>
        </div>
        <Button asChild>
          <Link href="/recruitments/new">
            <Plus className="h-4 w-4" />
            添加报考
          </Link>
        </Button>
      </div>

      {recruitments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-base font-medium">还没有报考日程</p>
            <p className="mt-1 text-sm text-muted-foreground">
              点击右上角添加你的第一条报考日程
            </p>
            <Button asChild className="mt-6">
              <Link href="/recruitments/new">
                <Plus className="h-4 w-4" />
                添加报考
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {recruitments.map((r) => {
            const stage = getCurrentStage(r);
            return (
              <Card key={r.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg leading-snug">
                        {r.title}
                      </CardTitle>
                      {stage && (
                        <Badge className={`mt-2 ${stage.className}`}>
                          {stage.label}
                        </Badge>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        aria-label="编辑"
                      >
                        <Link href={`/recruitments/${r.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      {r.sourceUrl && (
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          aria-label="查看原文"
                        >
                          <a
                            href={r.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <StageCheckbox
                      recruitmentId={r.id}
                      stage="registration"
                      done={r.registrationDone}
                      label="报名"
                      dateText={formatDateRange(r.registrationStart, r.registrationEnd)}
                    />
                    <StageCheckbox
                      recruitmentId={r.id}
                      stage="admissionTicket"
                      done={r.admissionTicketDone}
                      label="准考证"
                      dateText={formatDateRange(r.admissionTicketStart, r.admissionTicketEnd)}
                    />
                    <StageCheckbox
                      recruitmentId={r.id}
                      stage="writtenExam"
                      done={r.writtenExamDone}
                      label="笔试"
                      dateText={formatDate(r.writtenExamDate)}
                    />
                    <StageCheckbox
                      recruitmentId={r.id}
                      stage="interview"
                      done={r.interviewDone}
                      label="面试"
                      dateText={formatDate(r.interviewDate)}
                    />
                  </div>
                  {r.userNote && (
                    <p className="mt-3 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                      {r.userNote}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}