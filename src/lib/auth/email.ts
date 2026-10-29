import { Resend } from "resend";

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY 环境变量未设置");
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

const FROM_NAME = "岸上见";

export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<void> {
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error("RESEND_FROM_EMAIL 环境变量未设置");
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); border-radius: 12px; padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">岸上见</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">邮箱验证</p>
      </div>
      <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; margin-top: 16px;">
        <p style="margin: 0 0 16px; color: #374151; font-size: 16px;">你好，</p>
        <p style="margin: 0 0 24px; color: #374151; font-size: 16px;">
          请使用以下验证码完成邮箱验证：
        </p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #4f46e5;">${code}</span>
        </div>
        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
          验证码有效期为 15 分钟。如非本人操作，请忽略此邮件。
        </p>
      </div>
      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
        © 2025 岸上见. All rights reserved.
      </p>
    </div>
  `;

  const resend = getResend();
  const result = await resend.emails.send({
    from: `${FROM_NAME} <${fromEmail}>`,
    to,
    subject: "【岸上见】邮箱验证码",
    html,
  });

  if (result.error) {
    console.error("[Resend API Error]:", result.error);
    throw new Error(`邮件发送失败: ${result.error.message || "未知错误"}`);
  }
}