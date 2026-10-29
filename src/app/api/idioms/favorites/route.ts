import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

interface FavoriteItem {
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
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json([]);
  }

  const favorites = await prisma.idiomFavorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      idiom: { include: { frequency: true } },
      customIdiom: true,
    },
  });

  const items: FavoriteItem[] = favorites
    .map((f): FavoriteItem | null => {
      if (f.idiom) {
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
        };
      }
      if (f.customIdiom) {
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
        };
      }
      return null;
    })
    .filter((x): x is FavoriteItem => x !== null);

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { idiomId, customIdiomId } = await request.json();

  if (!idiomId && !customIdiomId) {
    return NextResponse.json({ error: "缺少成语标识" }, { status: 400 });
  }

  if (idiomId) {
    await prisma.idiomFavorite.upsert({
      where: { userId_idiomId: { userId: user.id, idiomId } },
      update: {},
      create: { userId: user.id, idiomId },
    });
  } else {
    await prisma.idiomFavorite.upsert({
      where: { userId_customIdiomId: { userId: user.id, customIdiomId } },
      update: {},
      create: { userId: user.id, customIdiomId },
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { idiomId, customIdiomId } = await request.json();

  if (!idiomId && !customIdiomId) {
    return NextResponse.json({ error: "缺少成语标识" }, { status: 400 });
  }

  const where = idiomId
    ? { userId_idiomId: { userId: user.id, idiomId } }
    : { userId_customIdiomId: { userId: user.id, customIdiomId } };

  await prisma.idiomFavorite.delete({
    where,
  });

  return NextResponse.json({ success: true });
}