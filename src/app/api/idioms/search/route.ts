import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({});
  }

  const searches = await prisma.idiomSearch.findMany({
    where: { userId: user.id, count: { gt: 0 } },
    select: { word: true, count: true },
  });

  const map: Record<string, number> = {};
  for (const s of searches) {
    map[s.word] = s.count;
  }
  return NextResponse.json(map);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({});
  }

  const { word } = await request.json();
  if (!word) {
    return NextResponse.json({});
  }

  await prisma.idiomSearch.upsert({
    where: { userId_word: { userId: user.id, word } },
    update: { count: { increment: 1 } },
    create: { userId: user.id, word, count: 1 },
  });

  return NextResponse.json({ success: true });
}