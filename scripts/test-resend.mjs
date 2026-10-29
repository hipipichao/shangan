import { readFileSync } from "fs";
import { Resend } from "resend";

function loadEnv() {
  try {
    const content = readFileSync(".env", "utf-8");
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {}
}

loadEnv();

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL;

if (!apiKey) {
  console.error("❌ 缺少 RESEND_API_KEY 环境变量");
  process.exit(1);
}

if (!fromEmail) {
  console.error("❌ 缺少 RESEND_FROM_EMAIL 环境变量");
  process.exit(1);
}

const to = process.argv[2];
if (!to) {
  console.error("用法: node scripts/test-resend.mjs <收件人邮箱>");
  process.exit(1);
}

const resend = new Resend(apiKey);

console.log(`正在发送测试邮件到 ${to}...`);
console.log(`发件人: 岸上见 <${fromEmail}>`);

try {
  const { data, error } = await resend.emails.send({
    from: `岸上见 <${fromEmail}>`,
    to,
    subject: "【岸上见】邮件发送测试",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); border-radius: 12px; padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">岸上见</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">邮件发送测试</p>
        </div>
        <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; margin-top: 16px;">
          <p style="margin: 0 0 16px; color: #374151; font-size: 16px;">你好，</p>
          <p style="margin: 0 0 16px; color: #374151; font-size: 16px;">
            这是一封来自<strong>岸上见</strong>的测试邮件。
          </p>
          <p style="margin: 0; color: #374151; font-size: 16px;">
            如果你收到了这封邮件，说明 Resend 邮件服务配置正确！🎉
          </p>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
          © 2025 岸上见. All rights reserved.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("❌ 发送失败:", error);
    process.exit(1);
  }

  console.log("✅ 邮件发送成功！");
  console.log("邮件 ID:", data?.id);
} catch (err) {
  console.error("❌ 发送异常:", err.message);
  process.exit(1);
}