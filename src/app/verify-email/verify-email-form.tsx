"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";

import { verifyEmailOtp, resendVerificationEmail } from "@/lib/auth/actions";
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

interface VerifyEmailFormProps {
  email: string;
}

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const sent = searchParams.get("sent");

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
            <CardTitle className="text-2xl">验证邮箱</CardTitle>
            <CardDescription>
              请输入发送到 <span className="font-medium text-foreground">{email || "你的邮箱"}</span> 的验证码
            </CardDescription>
          </CardHeader>
          <form action={verifyEmailOtp}>
            <input type="hidden" name="email" value={email} />
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {decodeURIComponent(error)}
                </div>
              )}
              {sent === "1" && (
                <div className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
                  验证码已重新发送，请查收邮件
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="otp">验证码</Label>
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="请输入 6 位验证码"
                  autoComplete="one-time-code"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full">
                验证
              </Button>
            </CardFooter>
          </form>
          <CardFooter className="flex flex-col gap-2 border-t px-6 py-4">
            <form action={resendVerificationEmail}>
              <input type="hidden" name="email" value={email} />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="w-full"
              >
                重新发送验证码
              </Button>
            </form>
            <p className="text-center text-xs text-muted-foreground">
              验证码 15 分钟内有效
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}