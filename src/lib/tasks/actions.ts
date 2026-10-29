"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

function startOfDay(d: Date) {
  const n = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  n.setUTCHours(0, 0, 0, 0);
  return new Date(n.getTime() - 8 * 60 * 60 * 1000);
}

export async function createTask(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("请先登录");
  }

  const title = (formData.get("title") as string)?.trim();
  const dateStr = formData.get("date") as string | null;

  if (!title) {
    throw new Error("任务标题不能为空");
  }

  const now = new Date();
  const date = dateStr ? startOfDay(new Date(dateStr)) : startOfDay(now);

  await prisma.task.create({
    data: {
      userId: user.id,
      title,
      type: "DAILY",
      date,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/statistics");
}

export async function toggleTask(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("请先登录");
  }

  const id = formData.get("id") as string;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task || task.userId !== user.id) {
    throw new Error("任务不存在");
  }

  await prisma.task.update({
    where: { id },
    data: { completed: !task.completed },
  });

  revalidatePath("/tasks");
  revalidatePath("/statistics");
}

export async function deleteTask(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("请先登录");
  }

  const id = formData.get("id") as string;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task || task.userId !== user.id) {
    throw new Error("任务不存在");
  }

  await prisma.task.delete({ where: { id } });

  revalidatePath("/tasks");
  revalidatePath("/statistics");
}