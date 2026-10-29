"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

function startOfDay(d: Date) {
  const n = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  n.setUTCHours(0, 0, 0, 0);
  return new Date(n.getTime() - 8 * 60 * 60 * 1000);
}

export type JournalState = {
  message: string;
  success: boolean;
};

export async function saveJournal(
  prevState: JournalState,
  formData: FormData
): Promise<JournalState> {
  const user = await getCurrentUser();
  if (!user) {
    return { message: "请先登录", success: false };
  }

  const content = (formData.get("content") as string)?.trim();
  const dateStr = formData.get("date") as string | null;

  if (!content) {
    return { message: "笔记内容不能为空", success: false };
  }

  const date = dateStr ? startOfDay(new Date(dateStr)) : startOfDay(new Date());

  await prisma.journal.upsert({
    where: {
      userId_type_date: { userId: user.id, type: "DAILY", date },
    },
    update: { content },
    create: {
      userId: user.id,
      type: "DAILY",
      content,
      date,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/statistics");

  return { message: "保存成功", success: true };
}