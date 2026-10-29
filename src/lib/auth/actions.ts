"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { createSession, setSessionCookie, clearSessionCookie } from "@/lib/auth/server";
import { getCurrentUser } from "@/lib/auth/session";
import { verifyCaptcha } from "@/lib/auth/captcha";
import { sendVerificationEmail } from "@/lib/auth/email";

function redirectWithError(path: string, message: string): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}error=${encodeURIComponent(message)}`);
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function login(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirect") as string)?.trim() || "/";

  if (!email || !password) {
    redirectWithError("/login", "请输入邮箱和密码");
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    redirectWithError("/login", "邮箱或密码错误");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    redirectWithError("/login", "邮箱或密码错误");
  }

  if (!user.emailVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  const token = await createSession(user.id);
  (await cookies()).set(setSessionCookie(token));

  redirect(redirectTo);
}

export async function register(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const captcha = formData.get("captcha") as string;

  if (!email || !password) {
    redirectWithError("/register", "请输入邮箱和密码");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirectWithError("/register", "请输入有效的邮箱地址");
  }
  if (password.length < 6) {
    redirectWithError("/register", "密码至少 6 位字符");
  }
  if (password !== confirmPassword) {
    redirectWithError("/register", "两次输入的密码不一致");
  }

  const captchaOk = await verifyCaptcha(captcha);
  if (!captchaOk) {
    redirectWithError("/register", "验证码错误或已过期");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.emailVerified) {
    redirectWithError("/register", "该邮箱已被注册");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const name = email.split("@")[0];
  const code = generateOtp();
  const codeExpires = new Date(Date.now() + 15 * 60 * 1000);

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        password: hashedPassword,
        name,
        emailVerificationCode: code,
        emailVerificationCodeExpires: codeExpires,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        emailVerificationCode: code,
        emailVerificationCodeExpires: codeExpires,
      },
    });
  }

  try {
    await sendVerificationEmail(email, code);
  } catch {
    redirectWithError("/register", "验证码邮件发送失败，请稍后重试");
  }

  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

export async function verifyEmailOtp(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const otp = (formData.get("otp") as string)?.trim();

  if (!email || !otp) {
    redirectWithError(
      `/verify-email?email=${encodeURIComponent(email || "")}`,
      "请输入验证码"
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    redirectWithError(`/verify-email?email=${encodeURIComponent(email)}`, "用户不存在");
  }

  if (!user.emailVerificationCode || user.emailVerificationCode !== otp) {
    redirectWithError(`/verify-email?email=${encodeURIComponent(email)}`, "验证码错误");
  }

  if (!user.emailVerificationCodeExpires || user.emailVerificationCodeExpires < new Date()) {
    redirectWithError(`/verify-email?email=${encodeURIComponent(email)}`, "验证码已过期，请重新发送");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationCode: null,
      emailVerificationCodeExpires: null,
    },
  });

  const token = await createSession(user.id);
  (await cookies()).set(setSessionCookie(token));

  redirect("/");
}

export async function resendVerificationEmail(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();

  if (!email) {
    redirectWithError("/verify-email", "请输入邮箱");
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    redirectWithError(`/verify-email?email=${encodeURIComponent(email)}`, "用户不存在");
  }

  if (user.emailVerified) {
    redirect("/login?verified=1");
  }

  const code = generateOtp();
  const codeExpires = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationCode: code,
      emailVerificationCodeExpires: codeExpires,
    },
  });

  try {
    await sendVerificationEmail(email, code);
  } catch {
    redirectWithError(
      `/verify-email?email=${encodeURIComponent(email)}`,
      "验证码发送失败，请稍后重试"
    );
  }

  redirect(`/verify-email?email=${encodeURIComponent(email)}&sent=1`);
}

export async function signOutAction() {
  (await cookies()).set(clearSessionCookie());
  redirect("/login");
}

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirectWithError("/login", "请先登录");
  }

  const avatar = (formData.get("avatar") as string)?.trim();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      avatar: avatar || user.avatar || null,
    },
  });

  redirect("/profile");
}

export async function updatePassword(formData: FormData) {
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword) {
    redirectWithError("/profile", "请填写完整密码信息");
  }
  if (newPassword.length < 6) {
    redirectWithError("/profile", "新密码至少 6 位字符");
  }
  if (newPassword !== confirmPassword) {
    redirectWithError("/profile", "两次输入的新密码不一致");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirectWithError("/login", "请先登录");
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.password) {
    redirectWithError("/profile", "无法修改密码");
  }

  const valid = await bcrypt.compare(currentPassword, dbUser.password);
  if (!valid) {
    redirectWithError("/profile", "当前密码错误");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  redirect("/profile");
}