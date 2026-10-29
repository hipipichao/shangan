import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

type StageKey = "registration" | "admissionTicket" | "writtenExam" | "interview";

const STAGE_FIELD_MAP: Record<StageKey, string> = {
  registration: "registrationDone",
  admissionTicket: "admissionTicketDone",
  writtenExam: "writtenExamDone",
  interview: "interviewDone",
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const stage = body.stage as StageKey;
  const done = body.done as boolean;

  if (!stage || !(stage in STAGE_FIELD_MAP)) {
    return NextResponse.json({ error: "无效的阶段" }, { status: 400 });
  }

  const existing = await prisma.recruitment.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "未找到该日程" }, { status: 404 });
  }

  const field = STAGE_FIELD_MAP[stage];
  const updated = await prisma.recruitment.update({
    where: { id },
    data: { [field]: done },
  });

  return NextResponse.json({ ok: true, [field]: updated[field as keyof typeof updated] });
}