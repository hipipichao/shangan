"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

function startOfDay(d: Date) {
  const n = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  n.setUTCHours(0, 0, 0, 0);
  return new Date(n.getTime() - 8 * 60 * 60 * 1000);
}

// 批量创建长期任务（同一套重复星期几）
export async function createRecurringTasks(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("请先登录");

  const titles = formData.getAll("titles") as string[];
  const daysOfWeek = formData.get("daysOfWeek") as string;

  const cleanTitles = Array.from(
    new Set(titles.map((t) => t.trim()).filter(Boolean))
  );
  if (cleanTitles.length === 0 || !daysOfWeek) return;

  await prisma.recurringTask.createMany({
    data: cleanTitles.map((title) => ({
      userId: user.id,
      title,
      daysOfWeek,
    })),
  });

  revalidatePath("/tasks");
}

// 更新长期任务
export async function updateRecurringTask(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("请先登录");

  const id = formData.get("id") as string;
  const title = (formData.get("title") as string)?.trim();
  const daysOfWeek = formData.get("daysOfWeek") as string;

  if (!id || !title || !daysOfWeek) return;

  const task = await prisma.recurringTask.findUnique({ where: { id } });
  if (!task || task.userId !== user.id) return;

  await prisma.recurringTask.update({
    where: { id },
    data: { title, daysOfWeek },
  });

  revalidatePath("/tasks");
}

// 删除长期任务
export async function deleteRecurringTask(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("请先登录");

  const id = formData.get("id") as string;
  if (!id) return;

  const task = await prisma.recurringTask.findUnique({ where: { id } });
  if (!task || task.userId !== user.id) return;

  await prisma.recurringTask.delete({ where: { id } });

  revalidatePath("/tasks");
  revalidatePath("/statistics");
}

// 切换长期任务当天完成状态
export async function toggleRecurringTask(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("请先登录");

  const id = formData.get("id") as string;
  const dateStr = formData.get("date") as string;
  if (!id || !dateStr) return;

  const date = startOfDay(new Date(dateStr));

  const task = await prisma.recurringTask.findUnique({ where: { id } });
  if (!task || task.userId !== user.id) return;

  const existing = await prisma.recurringTaskCompletion.findUnique({
    where: { recurringTaskId_date: { recurringTaskId: id, date } },
  });

  if (existing) {
    await prisma.recurringTaskCompletion.update({
      where: { id: existing.id },
      data: { completed: !existing.completed },
    });
  } else {
    await prisma.recurringTaskCompletion.create({
      data: {
        recurringTaskId: id,
        userId: user.id,
        date,
        completed: true,
      },
    });
  }

  revalidatePath("/tasks");
  revalidatePath("/statistics");
}