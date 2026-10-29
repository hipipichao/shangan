import fs from "fs";
import path from "path";

import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return new Response("未登录", { status: 401 });
  }

  try {
    const filePath = path.join(process.cwd(), "public", "idiom-frequency.pdf");

    if (!fs.existsSync(filePath)) {
      return new Response("PDF 文件不存在，请联系管理员生成", { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);
    const filename = "公考成语词频背诵表.pdf";
    const encodedFilename = encodeURIComponent(filename);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="idiom-frequency.pdf"; filename*=UTF-8''${encodedFilename}`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err) {
    console.error("Failed to serve idiom PDF:", err);
    return new Response("Failed to serve PDF", { status: 500 });
  }
}