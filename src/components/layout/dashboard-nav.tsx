"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Box,
  Briefcase,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  Home,
  Info,
  LogOut,
  Menu,
  PlusCircle,
  Sparkles,
  User,
  X,
} from "lucide-react";

import { signOutAction } from "@/lib/auth/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "首页", icon: Home },
  { href: "/recruitments", label: "报考日程", icon: Briefcase },
];

const XINGCE_ITEMS = [
  { href: "/idioms", label: "成语学习", icon: BookOpen },
  { href: "/geometry", label: "立体截面", icon: Box },
];

const TODO_ITEMS = [
  { href: "/tasks", label: "创建任务", icon: PlusCircle },
  { href: "/statistics", label: "学习统计", icon: BarChart3 },
];

interface DashboardNavProps {
  avatar: string | null;
  initial: string;
  loggedIn?: boolean;
}

export function DashboardNav({ avatar, initial, loggedIn = true }: DashboardNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-tight">岸上见</span>
            <span className="text-[10px] text-muted-foreground">
              AnShang Jian
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
              <GraduationCap className="h-4 w-4" />
              行测
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {XINGCE_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem
                    key={item.href}
                    render={<Link href={item.href} />}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
              <ClipboardList className="h-4 w-4" />
              Todo任务
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {TODO_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem
                    key={item.href}
                    render={<Link href={item.href} />}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link
            href="/about"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              pathname === "/about"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground"
            )}
          >
            <Info className="h-4 w-4" />
            关于
          </Link>
        </nav>

        <div className="hidden items-center md:flex">
          {loggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full outline-none">
                <Avatar className="h-8 w-8 cursor-pointer">
                  {avatar ? (
                    <AvatarFallback className="bg-brand-50 text-base">
                      {avatar}
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback className="bg-brand-100 text-brand-700 text-xs">
                      {initial}
                    </AvatarFallback>
                  )}
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem render={<Link href="/profile" />}>
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">个人中心</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors hover:bg-accent focus:bg-accent focus:outline-none"
                  >
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">登录</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">注册</Link>
              </Button>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="切换菜单"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-72 max-w-[80vw] border-r border-border/60 bg-background shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="flex h-16 items-center justify-between border-b border-border/60 px-4">
                <Link
                  href="/"
                  className="flex items-center gap-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="font-bold tracking-tight">岸上见</span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  aria-label="关闭菜单"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex flex-col gap-1 p-3">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent",
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground"
                      )}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="px-3 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  行测
                </div>
                {XINGCE_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent",
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground"
                      )}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="px-3 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Todo任务
                </div>
                {TODO_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent",
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground"
                      )}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <Link
                  href="/about"
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent",
                    pathname === "/about"
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <Info className="h-4 w-4" />
                  关于
                </Link>
                <div className="mt-2 border-t border-border/60 pt-3">
                  {loggedIn ? (
                    <>
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        onClick={() => setMobileOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        个人中心
                      </Link>
                      <form action={signOutAction}>
                        <button
                          type="submit"
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-accent"
                        >
                          <LogOut className="h-4 w-4" />
                          退出登录
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="flex gap-2 px-3">
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link href="/login">登录</Link>
                      </Button>
                      <Button asChild size="sm" className="flex-1">
                        <Link href="/register">注册</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </nav>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}