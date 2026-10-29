import {
  BookOpen,
  ClipboardList,
  Briefcase,
  BarChart3,
  Box,
  Heart,
  Mail,
  Code2,
  Sparkles,
  Plus,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Todo任务",
    desc: "每日与长期任务管理，支持任务勾选与学习日记记录，养成良好备考习惯。",
  },
  {
    icon: BookOpen,
    title: "成语搜索",
    desc: "公考成语大全，支持按成语、拼音、首字母或释义搜索，可添加自定义成语与 PDF 背诵表下载。",
  },
  {
    icon: Briefcase,
    title: "报考日程",
    desc: "手动录入报名、笔试、面试等关键时间节点，按截止时间排序提醒。",
  },
  {
    icon: BarChart3,
    title: "学习统计",
    desc: "任务完成情况与进度统计，直观了解学习节奏与坚持情况。",
  },
  {
    icon: Box,
    title: "立体截面",
    desc: "3D 可视化练习立体几何截面问题，支持多种几何体与任意切割面。",
  },
  {
    icon: Plus,
    title: "更多功能添加中",
    desc: "后续将陆续上线更多实用功能，敬请期待。",
    disabled: true,
  },
];

const TECH_STACK = [
  "Next.js 15",
  "React 19",
  "TypeScript",
  "Prisma",
  "PostgreSQL",
  "Tailwind CSS",
  "Three.js",
  "Resend",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      {/* 项目介绍 */}
      <section className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30">
          <Sparkles className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">岸上见</h1>
        <p className="mt-2 text-muted-foreground">AI 公考备考助手 · 助你高效上岸</p>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          岸上见是一款面向公考考生的备考工具平台，致力于用 AI 与可视化技术帮助考生
          更高效地管理任务、积累知识、把握考试时间节点，让备考之路更加清晰从容。
        </p>
      </section>

      {/* 功能模块 */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">核心功能</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Card
                key={f.title}
                className={cn(
                  "transition-shadow hover:shadow-sm",
                  f.disabled && "border-dashed bg-muted/30"
                )}
              >
                <CardContent className="flex items-start gap-4 p-5">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      f.disabled
                        ? "bg-muted text-muted-foreground"
                        : "bg-brand-50 text-brand-600"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3
                      className={cn(
                        "font-medium",
                        f.disabled && "text-muted-foreground"
                      )}
                    >
                      {f.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 技术栈 */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">技术栈</h2>
        <div className="flex flex-wrap gap-2">
          {TECH_STACK.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* 联系 */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">联系我</h2>
        <Card>
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">邮箱</p>
                <a
                  href="mailto:goshangan@outlook.com"
                  className="text-sm text-muted-foreground hover:text-blue-600 hover:underline"
                >
                  goshangan@outlook.com
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                <Code2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">GitHub</p>
                <span className="text-sm text-muted-foreground">@shangan</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 页脚寄语 */}
      <section className="border-t border-border/60 pt-6 text-center">
        <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          用 <Heart className="h-4 w-4 fill-rose-500 text-rose-500" /> 制作，祝早日上岸
        </p>
      </section>
    </div>
  );
}