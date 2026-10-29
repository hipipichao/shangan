import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  const info = {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.slice(0, 7) + "..." : null,
    hasFromEmail: !!fromEmail,
    fromEmail,
  };

  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY 未设置", info }, { status: 500 });
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: `岸上见 <${fromEmail}>`,
      to: "hipipichao@qq.com",
      subject: "【岸上见】服务端邮件测试",
      html: "<p>这是一封来自 Next.js 服务端的测试邮件。</p>",
    });

    if (error) {
      return NextResponse.json({ error: "发送失败", details: error, info }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailId: data?.id, info });
  } catch (err) {
    return NextResponse.json({ error: "异常", message: (err as Error).message, info }, { status: 500 });
  }
}