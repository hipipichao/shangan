"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export async function createRecruitment(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const title = (formData.get("title") as string)?.trim();
  if (!title) {
    redirect("/recruitments/new?error=请填写报考标题");
  }

  await prisma.recruitment.create({
    data: {
      userId: user.id,
      title,
      registrationStart: parseDate(formData.get("registrationStart") as string),
      registrationEnd: parseDate(formData.get("registrationEnd") as string),
      admissionTicketStart: parseDate(formData.get("admissionTicketStart") as string),
      admissionTicketEnd: parseDate(formData.get("admissionTicketEnd") as string),
      writtenExamDate: parseDate(formData.get("writtenExamDate") as string),
      interviewDate: parseDate(formData.get("interviewDate") as string),
      sourceUrl: (formData.get("sourceUrl") as string)?.trim() || null,
      userNote: (formData.get("userNote") as string)?.trim() || null,
    },
  });

  redirect("/recruitments");
}

export async function updateRecruitment(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id = (formData.get("id") as string)?.trim();
  const title = (formData.get("title") as string)?.trim();
  if (!id || !title) {
    redirect(`/recruitments/${id}/edit?error=请填写报考标题`);
  }

  const existing = await prisma.recruitment.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existing || existing.userId !== user.id) {
    redirect("/recruitments");
  }

  await prisma.recruitment.update({
    where: { id },
    data: {
      title,
      registrationStart: parseDate(formData.get("registrationStart") as string),
      registrationEnd: parseDate(formData.get("registrationEnd") as string),
      admissionTicketStart: parseDate(formData.get("admissionTicketStart") as string),
      admissionTicketEnd: parseDate(formData.get("admissionTicketEnd") as string),
      writtenExamDate: parseDate(formData.get("writtenExamDate") as string),
      interviewDate: parseDate(formData.get("interviewDate") as string),
      sourceUrl: (formData.get("sourceUrl") as string)?.trim() || null,
      userNote: (formData.get("userNote") as string)?.trim() || null,
    },
  });

  redirect("/recruitments");
}

export async function deleteRecruitment(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id = (formData.get("id") as string)?.trim();
  if (!id) redirect("/recruitments");

  const existing = await prisma.recruitment.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (existing && existing.userId === user.id) {
    await prisma.recruitment.delete({ where: { id } });
  }

  redirect("/recruitments");
}