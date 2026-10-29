import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { generateIdiomInfo } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { word } = await request.json();
  if (!word) {
    return NextResponse.json({ error: "成语不能为空" }, { status: 400 });
  }

  try {
    const info = await generateIdiomInfo(word.trim());
    return NextResponse.json(info);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI 生成失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}