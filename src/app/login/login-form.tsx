"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";

import { login } from "@/lib/auth/actions";
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

export function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const redirectParam = searchParams.get("redirect");
  const verified = searchParams.get("verified");

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
            <CardTitle className="text-2xl">欢迎回来</CardTitle>
            <CardDescription>登录你的岸上见账户</CardDescription>
          </CardHeader>
          <form action={login}>
            {redirectParam && (
              <input type="hidden" name="redirect" value={redirectParam} />
            )}
            <CardContent className="space-y-4">
              {verified === "1" && (
                <div className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
                  邮箱验证成功，请登录
                </div>
              )}
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
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full">
                登录
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                还没有账号？
                <Link
                  href="/register"
                  className="ml-1 font-medium text-brand-600 hover:underline"
                >
                  立即注册
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}