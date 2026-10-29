import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

interface PracticeItem {
  id: string;
  word: string;
  pinyin: string | null;
  abbr: string | null;
  explanation: string | null;
  similar: string | null;
  opposite: string | null;
  usage: string | null;
  example: string | null;
  isCustom: boolean;
  isFrequent?: boolean;
  ease: number;
  interval: number;
  repetitions: number;
  lapses: number;
  dueDate: string;
  lastReviewedAt: string | null;
  lastGrade: number;
}

const EASE_MIN = 1.3;
const EASE_MAX = 2.8;
const EASE_DEFAULT = 2.5;

function computeNextState(
  grade: number,
  prev: { ease: number; interval: number; repetitions: number; lapses: number }
) {
  let ease = prev.ease;
  let interval = prev.interval;
  let repetitions = prev.repetitions;
  let lapses = prev.lapses;

  if (grade >= 3) {
    repetitions += 1;
    if (grade === 5) {
      ease = Math.min(EASE_MAX, ease + 0.1);
    }
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(prev.interval * ease);
    }
  } else {
    lapses += 1;
    repetitions = 0;
    ease = Math.max(EASE_MIN, ease - 0.2);
    interval = 1;
  }

  return { ease, interval, repetitions, lapses };
}

function buildFavoriteToPracticeMap(
  rows: { idiomId: string | null; customIdiomId: string | null }[]
) {
  const map = new Map<string, { idiomId: string | null; customIdiomId: string | null }>();
  for (const r of rows) {
    const key = r.idiomId ? `pub:${r.idiomId}` : `cust:${r.customIdiomId}`;
    map.set(key, { idiomId: r.idiomId, customIdiomId: r.customIdiomId });
  }
  return map;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const [favorites, records] = await Promise.all([
    prisma.idiomFavorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        idiom: { include: { frequency: true } },
        customIdiom: true,
      },
    }),
    prisma.idiomPracticeRecord.findMany({
      where: { userId: user.id },
    }),
  ]);

  const recordMap = new Map<string, (typeof records)[number]>();
  for (const r of records) {
    if (r.idiomId) recordMap.set(`pub:${r.idiomId}`, r);
    if (r.customIdiomId) recordMap.set(`cust:${r.customIdiomId}`, r);
  }

  const items: PracticeItem[] = favorites
    .map((f): PracticeItem | null => {
      if (f.idiom) {
        const key = `pub:${f.idiom.id}`;
        const rec = recordMap.get(key);
        return {
          id: f.idiom.id,
          word: f.idiom.word,
          pinyin: f.idiom.pinyin,
          abbr: f.idiom.abbr,
          explanation: f.idiom.explanation,
          similar: f.idiom.similar,
          opposite: f.idiom.opposite,
          usage: f.idiom.usage,
          example: null,
          isCustom: false,
          isFrequent: !!f.idiom.frequency,
          ease: rec?.ease ?? EASE_DEFAULT,
          interval: rec?.interval ?? 0,
          repetitions: rec?.repetitions ?? 0,
          lapses: rec?.lapses ?? 0,
          dueDate: (rec?.dueDate ?? new Date(0)).toISOString(),
          lastReviewedAt: rec?.lastReviewedAt?.toISOString() ?? null,
          lastGrade: rec?.lastGrade ?? 0,
        };
      }
      if (f.customIdiom) {
        const key = `cust:${f.customIdiom.id}`;
        const rec = recordMap.get(key);
        return {
          id: f.customIdiom.id,
          word: f.customIdiom.word,
          pinyin: f.customIdiom.pinyin,
          abbr: null,
          explanation: f.customIdiom.explanation,
          similar: f.customIdiom.similar,
          opposite: f.customIdiom.opposite,
          usage: f.customIdiom.usage,
          example: f.customIdiom.example,
          isCustom: true,
          ease: rec?.ease ?? EASE_DEFAULT,
          interval: rec?.interval ?? 0,
          repetitions: rec?.repetitions ?? 0,
          lapses: rec?.lapses ?? 0,
          dueDate: (rec?.dueDate ?? new Date(0)).toISOString(),
          lastReviewedAt: rec?.lastReviewedAt?.toISOString() ?? null,
          lastGrade: rec?.lastGrade ?? 0,
        };
      }
      return null;
    })
    .filter((x): x is PracticeItem => x !== null);

  const now = Date.now();
  const dueCount = items.filter(
    (i) => new Date(i.dueDate).getTime() <= now
  ).length;

  return NextResponse.json({ items, dueCount });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { idiomId, customIdiomId, grade } = await request.json();

  if (!idiomId && !customIdiomId) {
    return NextResponse.json({ error: "缺少成语标识" }, { status: 400 });
  }

  const g = Math.max(0, Math.min(5, Math.round(grade ?? 0)));

  const where = idiomId
    ? { userId_idiomId: { userId: user.id, idiomId } }
    : { userId_customIdiomId: { userId: user.id, customIdiomId } };

  const existing = await prisma.idiomPracticeRecord.findUnique({ where });

  const prev = {
    ease: existing?.ease ?? EASE_DEFAULT,
    interval: existing?.interval ?? 0,
    repetitions: existing?.repetitions ?? 0,
    lapses: existing?.lapses ?? 0,
  };

  const next = computeNextState(g, prev);
  const dueDate = new Date(Date.now() + next.interval * 24 * 60 * 60 * 1000);

  const record = await prisma.idiomPracticeRecord.upsert({
    where,
    update: {
      ease: next.ease,
      interval: next.interval,
      repetitions: next.repetitions,
      lapses: next.lapses,
      dueDate,
      lastReviewedAt: new Date(),
      lastGrade: g,
    },
    create: {
      userId: user.id,
      idiomId: idiomId || null,
      customIdiomId: customIdiomId || null,
      ease: next.ease,
      interval: next.interval,
      repetitions: next.repetitions,
      lapses: next.lapses,
      dueDate,
      lastReviewedAt: new Date(),
      lastGrade: g,
    },
  });

  return NextResponse.json({
    success: true,
    ease: record.ease,
    interval: record.interval,
    repetitions: record.repetitions,
    lapses: record.lapses,
    dueDate: record.dueDate.toISOString(),
  });
}