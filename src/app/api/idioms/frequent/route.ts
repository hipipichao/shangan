import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const frequencies = await prisma.idiomFrequency.findMany({
    orderBy: { count: "desc" },
    include: {
      idiom: true,
    },
  });

  const items = frequencies.map((f) => ({
    id: f.idiom.id,
    word: f.idiom.word,
    pinyin: f.idiom.pinyin,
    abbr: f.idiom.abbr,
    explanation: f.idiom.explanation,
    similar: f.idiom.similar,
    opposite: f.idiom.opposite,
    usage: f.idiom.usage,
    count: f.count,
    isCustom: false,
  }));

  return NextResponse.json(items);
}