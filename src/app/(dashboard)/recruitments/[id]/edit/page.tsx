import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { deleteRecruitment } from "@/lib/recruitment/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EditRecruitmentForm } from "./edit-form";

export const dynamic = "force-dynamic";

function toDateInput(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

interface EditRecruitmentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRecruitmentPage({
  params,
}: EditRecruitmentPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const recruitment = await prisma.recruitment.findUnique({ where: { id } });

  if (!recruitment || recruitment.userId !== user.id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="返回">
          <Link href="/recruitments">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            编辑报考日程
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">报考信息</CardTitle>
        </CardHeader>
        <CardContent>
          <EditRecruitmentForm
            data={{
              id: recruitment.id,
              title: recruitment.title,
              registrationStart: toDateInput(recruitment.registrationStart),
              registrationEnd: toDateInput(recruitment.registrationEnd),
              admissionTicketStart: toDateInput(recruitment.admissionTicketStart),
              admissionTicketEnd: toDateInput(recruitment.admissionTicketEnd),
              writtenExamDate: toDateInput(recruitment.writtenExamDate),
              interviewDate: toDateInput(recruitment.interviewDate),
              sourceUrl: recruitment.sourceUrl || "",
              userNote: recruitment.userNote || "",
            }}
          />
        </CardContent>
      </Card>

      <form action={deleteRecruitment}>
        <input type="hidden" name="id" value={recruitment.id} />
        <Button
          type="submit"
          variant="outline"
          className="w-full text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
          删除此报考信息
        </Button>
      </form>
    </div>
  );
}