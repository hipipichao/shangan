import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ content: "" });
  }

  const { searchParams } = new URL(request.url);
  const idiomId = searchParams.get("idiomId");
  const customIdiomId = searchParams.get("customIdiomId");

  if (!idiomId && !customIdiomId) {
    return NextResponse.json({ error: "缺少成语标识" }, { status: 400 });
  }

  const where = idiomId
    ? { userId: user.id, idiomId }
    : { userId: user.id, customIdiomId };

  const note = await prisma.idiomNote.findFirst({ where });

  return NextResponse.json(note ? { content: note.content } : { content: "" });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { idiomId, customIdiomId, content } = await request.json();

  if (!idiomId && !customIdiomId) {
    return NextResponse.json({ error: "缺少成语标识" }, { status: 400 });
  }

  const trimmed = (content ?? "").trim();

  if (!trimmed) {
    const where = idiomId
      ? { userId_idiomId: { userId: user.id, idiomId } }
      : { userId_customIdiomId: { userId: user.id, customIdiomId } };

    await prisma.idiomNote.deleteMany({
      where: idiomId
        ? { userId: user.id, idiomId }
        : { userId: user.id, customIdiomId },
    }).catch(() => {});

    return NextResponse.json({ success: true, content: "" });
  }

  const where = idiomId
    ? { userId_idiomId: { userId: user.id, idiomId } }
    : { userId_customIdiomId: { userId: user.id, customIdiomId } };

  const note = await prisma.idiomNote.upsert({
    where,
    update: { content: trimmed },
    create: {
      userId: user.id,
      idiomId: idiomId || null,
      customIdiomId: customIdiomId || null,
      content: trimmed,
    },
  });

  return NextResponse.json({ success: true, content: note.content });
}