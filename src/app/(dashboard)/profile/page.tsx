import { KeyRound, User } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { updatePassword, updateProfile } from "@/lib/auth/actions";
import { AVATAR_OPTIONS } from "@/lib/constants/avatars";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ProfilePageProps {
  searchParams: Promise<{ error?: string; success?: string }>;
}

export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const user = await getCurrentUser();
  const { error, success } = await searchParams;

  if (!user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <h1 className="text-xl font-semibold">请先登录</h1>
      </div>
    );
  }

  const initial = user.email?.charAt(0).toUpperCase() ?? "用";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          个人中心
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          管理你的账号信息
        </p>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <Avatar className="h-14 w-14">
            {user.avatar ? (
              <AvatarFallback className="bg-brand-50 text-2xl">
                {user.avatar}
              </AvatarFallback>
            ) : (
              <AvatarFallback className="bg-brand-100 text-xl font-semibold text-brand-700">
                {initial}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {user.email ?? "未设置邮箱"}
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <span className="text-muted-foreground">邮箱账号</span>
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {decodeURIComponent(error)}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          {decodeURIComponent(success)}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            个人资料
          </CardTitle>
          <CardDescription>设置你的头像</CardDescription>
        </CardHeader>
        <form action={updateProfile}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>头像</Label>
              <div className="flex flex-wrap gap-3">
                {AVATAR_OPTIONS.map((emoji, index) => {
                  const checked = user.avatar === emoji;
                  return (
                    <Label
                      key={`${emoji}-${index}`}
                      className={cn(
                        "flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 bg-muted/50 text-2xl transition-all hover:scale-105",
                        "border-transparent has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:ring-2 has-[:checked]:ring-brand-500/30 has-[:checked]:scale-110"
                      )}
                    >
                      <input
                        type="radio"
                        name="avatar"
                        value={emoji}
                        defaultChecked={checked}
                        className="sr-only"
                      />
                      {emoji}
                    </Label>
                  );
                })}
                <Label
                  className={cn(
                    "flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 bg-muted/50 text-sm font-semibold text-muted-foreground transition-all hover:scale-105",
                    "border-transparent has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:ring-2 has-[:checked]:ring-brand-500/30 has-[:checked]:text-brand-700 has-[:checked]:scale-110"
                  )}
                >
                  <input
                    type="radio"
                    name="avatar"
                    value=""
                    defaultChecked={!user.avatar}
                    className="sr-only"
                  />
                  {initial}
                </Label>
              </div>
            </div>
            <Button type="submit">保存</Button>
          </CardContent>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" />
            修改密码
          </CardTitle>
          <CardDescription>定期更换密码可以保护账号安全</CardDescription>
        </CardHeader>
        <form action={updatePassword}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">当前密码</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                placeholder="请输入当前密码"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="至少 6 位字符"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="再次输入新密码"
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit">保存密码</Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}