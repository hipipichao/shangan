"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";

import { register } from "@/lib/auth/actions";
import { Turnstile } from "@/components/auth/turnstile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [captchaToken, setCaptchaToken] = useState("");

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="absolute inset-0 bg-grid opacity-[0.03]" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-bold tracking-tight">岸上见</span>
              <span className="text-[11px] text-muted-foreground">
                AnShang Jian
              </span>
            </div>
          </Link>
        </div>

        <Card className="border-border/60 shadow-xl shadow-brand-900/5">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">创建账号</CardTitle>
            <CardDescription>加入岸上见，开启高效备考之旅</CardDescription>
          </CardHeader>
          <form action={register}>
            <input type="hidden" name="captcha" value={captchaToken} />
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {decodeURIComponent(error)}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="请输入邮箱"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="至少 6 位字符"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">确认密码</Label>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder="再次输入密码"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>安全验证</Label>
                <Turnstile
                  onVerify={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken("")}
                  onError={() => setCaptchaToken("")}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={!captchaToken}>
                注册
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                已有账号？
                <Link
                  href="/login"
                  className="ml-1 font-medium text-brand-600 hover:underline"
                >
                  立即登录
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}