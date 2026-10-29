import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const idioms = await prisma.idiom.findMany({
    where: { explanation: { not: null } },
    select: { id: true, word: true, pinyin: true, explanation: true },
  });

  return NextResponse.json(idioms);
}