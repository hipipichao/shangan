import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const MAX_RESULTS = 100;
const FETCH_POOL = MAX_RESULTS * 3;

function scoreItem(
  q: string,
  word: string | null,
  pinyin: string | null,
  abbr: string | null,
  explanation: string | null
): number {
  const query = q.toLowerCase();
  let score = 0;

  const w = word?.toLowerCase() ?? "";
  if (w === query) {
    score = Math.max(score, 1000);
  } else if (w.startsWith(query)) {
    score = Math.max(score, 800);
  } else if (w.includes(query)) {
    score = Math.max(score, 600);
  }

  const p = pinyin?.toLowerCase() ?? "";
  if (p === query) {
    score = Math.max(score, 500);
  } else if (p.includes(query)) {
    score = Math.max(score, 400);
  }

  const a = abbr?.toLowerCase() ?? "";
  if (a === query) {
    score = Math.max(score, 350);
  } else if (a.includes(query)) {
    score = Math.max(score, 250);
  }

  const e = explanation?.toLowerCase() ?? "";
  if (e.includes(query)) {
    score = Math.max(score, 100);
  }

  return score;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json([]);
  }

  const user = await getCurrentUser();

  const [publicIdioms, customIdioms] = await Promise.all([
    prisma.idiom.findMany({
      where: {
        OR: [
          { word: { contains: q, mode: "insensitive" } },
          { pinyin: { contains: q, mode: "insensitive" } },
          { abbr: { contains: q.toLowerCase(), mode: "insensitive" } },
          { explanation: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { frequency: true },
      take: FETCH_POOL,
    }),
    user
      ? prisma.customIdiom.findMany({
          where: {
            userId: user.id,
            OR: [
              { word: { contains: q, mode: "insensitive" } },
              { pinyin: { contains: q, mode: "insensitive" } },
              { explanation: { contains: q, mode: "insensitive" } },
            ],
          },
          take: FETCH_POOL,
        })
      : Promise.resolve([]),
  ]);

  const scored = [
    ...customIdioms.map((c) => ({
      item: {
        id: c.id,
        word: c.word,
        pinyin: c.pinyin,
        explanation: c.explanation,
        similar: c.similar,
        opposite: c.opposite,
        usage: c.usage,
        example: c.example,
        isCustom: true,
      },
      score: scoreItem(q, c.word, c.pinyin, null, c.explanation) + 10,
    })),
    ...publicIdioms.map((i) => ({
      item: {
        id: i.id,
        word: i.word,
        pinyin: i.pinyin,
        abbr: i.abbr,
        explanation: i.explanation,
        similar: i.similar,
        opposite: i.opposite,
        usage: i.usage,
        isCustom: false,
        isFrequent: !!i.frequency,
      },
      score: scoreItem(q, i.word, i.pinyin, i.abbr, i.explanation),
    })),
  ];

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.item.word || "").localeCompare(b.item.word || "", "zh-Hans-CN");
  });

  return NextResponse.json(scored.slice(0, MAX_RESULTS).map((s) => s.item));
}