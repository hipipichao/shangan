import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const idioms = await prisma.customIdiom.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(idioms);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const { word, pinyin, explanation, similar, opposite, usage, example } = body;

  if (!word) {
    return NextResponse.json({ error: "成语不能为空" }, { status: 400 });
  }

  const idiom = await prisma.customIdiom.create({
    data: {
      userId: user.id,
      word: word.trim(),
      pinyin: pinyin || null,
      explanation: explanation || null,
      similar: similar || null,
      opposite: opposite || null,
      usage: usage || null,
      example: example || null,
    },
  });

  return NextResponse.json(idiom);
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const { id, word, pinyin, explanation, similar, opposite, usage, example } = body;

  if (!id) {
    return NextResponse.json({ error: "ID 不能为空" }, { status: 400 });
  }

  const idiom = await prisma.customIdiom.updateMany({
    where: { id, userId: user.id },
    data: {
      word: word?.trim(),
      pinyin: pinyin || null,
      explanation: explanation || null,
      similar: similar || null,
      opposite: opposite || null,
      usage: usage || null,
      example: example || null,
    },
  });

  return NextResponse.json({ success: true, count: idiom.count });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "ID 不能为空" }, { status: 400 });
  }

  await prisma.customIdiom.deleteMany({
    where: { id, userId: user.id },
  });

  return NextResponse.json({ success: true });
}