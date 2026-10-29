import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ items: [] });
  }

  const searches = await prisma.idiomSearch.findMany({
    where: { userId: user.id, count: { gt: 0 } },
    orderBy: { count: "desc" },
    take: 20,
    select: { word: true, count: true },
  });

  if (searches.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const words = searches.map((s) => s.word);
  const idioms = await prisma.idiom.findMany({
    where: { word: { in: words } },
    select: {
      id: true,
      word: true,
      pinyin: true,
      abbr: true,
      explanation: true,
      similar: true,
      opposite: true,
      usage: true,
    },
  });

  const idiomMap = new Map(idioms.map((i) => [i.word, i]));

  const items = searches
    .map((s) => {
      const idiom = idiomMap.get(s.word);
      if (!idiom) return null;
      return {
        ...idiom,
        count: s.count,
        isCustom: false,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ items });
}