import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  BookOpen,
  Repeat,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Tab = "daily" | "recurring";

interface StatisticsPageProps {
  searchParams: Promise<{
    tab?: string;
    date?: string;
    week?: string;
  }>;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "daily", label: "每日" },
  { key: "recurring", label: "长期" },
];

function startOfDay(d: Date) {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}

function startOfWeek(d: Date) {
  const n = startOfDay(d);
  const day = n.getDay();
  const diff = (day + 6) % 7;
  n.setDate(n.getDate() - diff);
  return n;
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatWeekRange(weekStart: Date) {
  const end = addDays(weekStart, 6);
  return `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`;
}

function weekdayNumber(d: Date) {
  const day = d.getDay();
  return day === 0 ? 7 : day;
}

const WEEKDAY_HEADERS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

export default async function StatisticsPage({
  searchParams,
}: StatisticsPageProps) {
  const user = await getCurrentUser();
  const { tab: tabParam, date: dateParam, week: weekParam } =
    await searchParams;

  if (!user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <h1 className="text-xl font-semibold">请先登录</h1>
      </div>
    );
  }

  const tab: Tab = tabParam === "recurring" ? tabParam : "daily";

  const today = startOfDay(new Date());

  // 选中的日期
  const selectedDate = dateParam
    ? startOfDay(new Date(dateParam))
    : today;
  const nextDay = addDays(selectedDate, 1);

  // 选中的周（用于长期标签页）
  const selectedWeekStart = weekParam
    ? startOfDay(new Date(weekParam))
    : startOfWeek(today);
  const selectedWeekEnd = addDays(selectedWeekStart, 6);

  const prevDate = addDays(selectedDate, -1);
  const nextDate = addDays(selectedDate, 1);
  const prevWeek = addDays(selectedWeekStart, -7);
  const nextWeek = addDays(selectedWeekStart, 7);

  const isCurrentDay = formatDate(selectedDate) === formatDate(today);
  const isCurrentWeek =
    formatDate(selectedWeekStart) === formatDate(startOfWeek(today));

  const qs = (parts: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    Object.entries(parts).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });
    return sp.toString();
  };

  const [dayTasks, dayJournal, recurringTasks, recurringCompletions] =
    await Promise.all([
      tab === "daily"
        ? prisma.task.findMany({
            where: {
              userId: user.id,
              type: "DAILY",
              date: { gte: selectedDate, lt: nextDay },
            },
            orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
          })
        : Promise.resolve([]),
      tab === "daily"
        ? prisma.journal.findFirst({
            where: {
              userId: user.id,
              type: "DAILY",
              date: selectedDate,
            },
          })
        : Promise.resolve(null),
      tab === "recurring"
        ? prisma.recurringTask.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "asc" },
          })
        : Promise.resolve([]),
      tab === "daily"
        ? prisma.recurringTaskCompletion.findMany({
            where: {
              userId: user.id,
              date: selectedDate,
            },
          })
        : tab === "recurring"
        ? prisma.recurringTaskCompletion.findMany({
            where: {
              userId: user.id,
              date: { gte: selectedWeekStart, lte: selectedWeekEnd },
            },
          })
        : Promise.resolve([]),
    ]);

  const recurringDoneMap = new Map<string, boolean>();
  recurringCompletions.forEach((c) => {
    recurringDoneMap.set(
      `${c.recurringTaskId}_${formatDate(c.date)}`,
      c.completed
    );
  });

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(selectedWeekStart, i)
  );

  // 当天匹配的长期任务
  const selectedWeekday = String(weekdayNumber(selectedDate));
  const dayRecurringTasks = recurringTasks.filter((t) =>
    t.daysOfWeek.split(",").includes(selectedWeekday)
  );
  const dayRecurringCompleted = dayRecurringTasks.filter(
    (t) => recurringDoneMap.get(`${t.id}_${formatDate(selectedDate)}`)
  ).length;

  const dayRegularCompleted = dayTasks.filter((t) => t.completed).length;
  const dayCompleted = dayRegularCompleted + dayRecurringCompleted;
  const dayTotal = dayTasks.length + dayRecurringTasks.length;
  const dayRate = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0;

  // 长期任务本周统计
  let recurringShouldCount = 0;
  let recurringDoneCount = 0;
  recurringTasks.forEach((task) => {
    const taskDays = task.daysOfWeek.split(",").filter(Boolean);
    weekDays.forEach((day, idx) => {
      const dayNum = String(idx + 1);
      if (taskDays.includes(dayNum)) {
        recurringShouldCount += 1;
        if (recurringDoneMap.get(`${task.id}_${formatDate(day)}`)) {
          recurringDoneCount += 1;
        }
      }
    });
  });
  const recurringRate =
    recurringShouldCount > 0
      ? Math.round((recurringDoneCount / recurringShouldCount) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          学习统计
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          回顾你的学习数据，见证每一步成长
        </p>
      </section>

      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={
              t.key === "daily"
                ? `?${qs({ tab: t.key, date: formatDate(selectedDate) })}`
                : `?${qs({ tab: t.key, week: formatDate(selectedWeekStart) })}`
            }
            className={`flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* ===================== DAILY TAB ===================== */}
      {tab === "daily" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-lg">每日任务完成情况</CardTitle>
                <div className="flex items-center gap-2">
                  <Link
                    href={`?${qs({ tab: "daily", date: formatDate(prevDate) })}`}
                  >
                    <Button variant="outline" size="icon" aria-label="前一天">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                  <span className="min-w-[180px] text-center text-sm font-semibold">
                    {selectedDate.toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "long",
                    })}
                    {isCurrentDay && " 今天"}
                  </span>
                  {selectedDate < today && (
                    <Link
                      href={`?${qs({ tab: "daily", date: formatDate(nextDate) })}`}
                    >
                      <Button variant="outline" size="icon" aria-label="后一天">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                method="get"
                action="/statistics"
                className="flex flex-wrap items-end gap-3"
              >
                <input type="hidden" name="tab" value="daily" />
                <div className="space-y-1.5">
                  <label htmlFor="date" className="text-xs text-muted-foreground">
                    选择日期
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={formatDate(selectedDate)}
                    max={formatDate(today)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>
                <Button type="submit" size="sm">
                  查看
                </Button>
              </form>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">任务总数</p>
                  <p className="mt-1 text-xl font-bold">{dayTotal}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">已完成</p>
                  <p className="mt-1 text-xl font-bold text-emerald-600">
                    {dayCompleted}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">完成率</p>
                  <p className="mt-1 text-xl font-bold text-orange-600">
                    {dayRate}%
                  </p>
                </div>
              </div>

              {dayTotal > 0 && (
                <Progress
                  value={(dayCompleted / dayTotal) * 100}
                  className="h-2"
                />
              )}

              {dayTotal === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  该日暂无任务记录
                </div>
              ) : (
                <ul className="space-y-2">
                  {dayRecurringTasks.length > 0 && (
                    <>
                      <li className="flex items-center gap-2 py-1">
                        <div className="h-px flex-1 bg-border" />
                        <span className="flex items-center gap-1 text-xs text-cyan-700">
                          <Repeat className="h-3 w-3" />
                          长期任务
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </li>
                      {dayRecurringTasks.map((t) => {
                        const done =
                          recurringDoneMap.get(
                            `${t.id}_${formatDate(selectedDate)}`
                          ) ?? false;
                        return (
                          <li
                            key={t.id}
                            className="flex items-center gap-3 rounded-md border border-border px-3 py-2 min-h-[3.25rem]"
                          >
                            {done ? (
                              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
                            ) : (
                              <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                            )}
                            <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center self-stretch">
                              <span
                                className={`text-sm ${
                                  done
                                    ? "text-muted-foreground line-through"
                                    : "text-foreground"
                                }`}
                              >
                                {t.title}
                              </span>
                              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                                <Repeat className="h-3 w-3" />
                                <span className="inline-flex h-4 items-center rounded bg-cyan-100 px-1 text-[10px] font-medium leading-none text-cyan-700">
                                  长
                                </span>
                                <span className="truncate">长期任务</span>
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </>
                  )}

                  {dayRecurringTasks.length > 0 && (
                    <li className="flex items-center gap-2 py-1">
                      <div className="h-px flex-1 bg-border" />
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <BookOpen className="h-3 w-3" />
                        普通任务
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </li>
                  )}

                  {dayTasks.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 rounded-md border border-border px-3 py-2 min-h-[3.25rem]"
                    >
                      {t.completed ? (
                        <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                      )}
                      <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center self-stretch">
                        <span
                          className={`text-sm ${
                            t.completed
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {t.title}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-brand-500" />
                每日一记
                <span className="text-xs font-normal text-muted-foreground">
                  {selectedDate.toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dayJournal ? (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {dayJournal.content}
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  该日暂无笔记
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===================== RECURRING TAB ===================== */}
      {tab === "recurring" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Repeat className="h-5 w-5 text-brand-500" />
                  长期任务完成情况
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Link
                    href={`?${qs({ tab: "recurring", week: formatDate(prevWeek) })}`}
                  >
                    <Button variant="outline" size="icon" aria-label="上一周">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                  <span className="min-w-[220px] text-center text-sm font-semibold">
                    {formatWeekRange(selectedWeekStart)}
                    {isCurrentWeek && " 本周"}
                  </span>
                  {selectedWeekStart < startOfWeek(today) && (
                    <Link
                      href={`?${qs({ tab: "recurring", week: formatDate(nextWeek) })}`}
                    >
                      <Button variant="outline" size="icon" aria-label="下一周">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                method="get"
                action="/statistics"
                className="flex flex-wrap items-end gap-3"
              >
                <input type="hidden" name="tab" value="recurring" />
                <div className="space-y-1.5">
                  <label htmlFor="week" className="text-xs text-muted-foreground">
                    选择周（任选一周内的日期）
                  </label>
                  <input
                    id="week"
                    name="week"
                    type="date"
                    defaultValue={formatDate(selectedWeekStart)}
                    max={formatDate(today)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>
                <Button type="submit" size="sm">
                  查看
                </Button>
              </form>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">长期任务数</p>
                  <p className="mt-1 text-xl font-bold">{recurringTasks.length}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">已完成</p>
                  <p className="mt-1 text-xl font-bold text-emerald-600">
                    {recurringDoneCount}/{recurringShouldCount}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">完成率</p>
                  <p className="mt-1 text-xl font-bold text-orange-600">
                    {recurringRate}%
                  </p>
                </div>
              </div>

              {recurringShouldCount > 0 && (
                <Progress
                  value={(recurringDoneCount / recurringShouldCount) * 100}
                  className="h-2"
                />
              )}

              {recurringTasks.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  暂无长期任务
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="border border-border bg-muted/40 px-3 py-2 text-center font-medium">
                          任务
                        </th>
                        {WEEKDAY_HEADERS.map((h, i) => (
                          <th
                            key={h}
                            className={cn(
                              "border border-border bg-muted/40 px-2 py-2 text-center font-medium",
                              formatDate(weekDays[i]) === formatDate(today) &&
                                "text-brand-600"
                            )}
                          >
                            <div className="flex flex-col items-center">
                              <span>{h}</span>
                              <span className="text-[10px] font-normal text-muted-foreground">
                                {weekDays[i].getDate()}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recurringTasks.map((task) => {
                        const taskDays = task.daysOfWeek
                          .split(",")
                          .filter(Boolean);
                        return (
                          <tr key={task.id}>
                            <td className="border border-border px-3 py-2 text-center align-middle">
                              <span className="font-medium">{task.title}</span>
                            </td>
                            {WEEKDAY_HEADERS.map((h, i) => {
                              const dayNum = String(i + 1);
                              const repeats = taskDays.includes(dayNum);
                              const completed = recurringDoneMap.get(
                                `${task.id}_${formatDate(weekDays[i])}`
                              );
                              let cellContent: React.ReactNode;
                              if (repeats) {
                                cellContent = completed ? (
                                  <CheckCircle className="mx-auto h-4 w-4 text-emerald-500" />
                                ) : (
                                  <Circle className="mx-auto h-4 w-4 text-muted-foreground" />
                                );
                              } else {
                                cellContent = (
                                  <span className="text-muted-foreground/40">—</span>
                                );
                              }
                              return (
                                <td
                                  key={h}
                                  className={cn(
                                    "border border-border px-2 py-2 text-center align-middle",
                                    formatDate(weekDays[i]) === formatDate(today) &&
                                      "bg-brand-50/40"
                                  )}
                                >
                                  {cellContent}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}