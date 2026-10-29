import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { createTask, toggleTask } from "@/lib/tasks/actions";
import { toggleRecurringTask } from "@/lib/recurring-tasks/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo, Plus, Repeat } from "lucide-react";
import { JournalCard } from "@/components/journal-card";
import { DeleteTaskButton } from "@/components/delete-task-button";
import { RecurringTaskManager } from "@/components/recurring-task-manager";

export const dynamic = "force-dynamic";

type Tab = "daily" | "recurring";

interface TasksPageProps {
  searchParams: Promise<{ tab?: string }>;
}

const UTC8_OFFSET_MS = 8 * 60 * 60 * 1000;

function toUTC8(d: Date) {
  return new Date(d.getTime() + UTC8_OFFSET_MS);
}

function startOfDay(d: Date) {
  const n = toUTC8(d);
  n.setUTCHours(0, 0, 0, 0);
  return new Date(n.getTime() - UTC8_OFFSET_MS);
}

function formatDate(d: Date) {
  const n = toUTC8(d);
  const y = n.getUTCFullYear();
  const m = String(n.getUTCMonth() + 1).padStart(2, "0");
  const day = String(n.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTime(d: Date) {
  const n = toUTC8(d);
  const hh = String(n.getUTCHours()).padStart(2, "0");
  const mm = String(n.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function weekdayNumber(d: Date) {
  const day = toUTC8(d).getUTCDay();
  return day === 0 ? 7 : day;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "daily", label: "本日任务" },
  { key: "recurring", label: "长期任务" },
];

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const user = await getCurrentUser();
  const { tab: tabParam } = await searchParams;

  if (!user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <h1 className="text-xl font-semibold">请先登录</h1>
      </div>
    );
  }

  const tab: Tab = tabParam === "recurring" ? tabParam : "daily";

  const today = startOfDay(new Date());
  const todayWeekday = String(weekdayNumber(today));

  const [dailyTasks, dailyJournal, allRecurringTasks] =
    await Promise.all([
      prisma.task.findMany({
        where: {
          userId: user.id,
          type: "DAILY",
          date: { gte: today, lt: new Date(today.getTime() + 86400000) },
        },
        orderBy: [{ completed: "asc" }, { createdAt: "asc" }],
      }),
      prisma.journal.findUnique({
        where: {
          userId_type_date: { userId: user.id, type: "DAILY", date: today },
        },
      }),
      prisma.recurringTask.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  const todayRecurringTasks = allRecurringTasks.filter((t) =>
    t.daysOfWeek.split(",").includes(todayWeekday)
  );

  const todayRecurringCompletions =
    todayRecurringTasks.length > 0
      ? await prisma.recurringTaskCompletion.findMany({
          where: {
            userId: user.id,
            date: today,
            recurringTaskId: { in: todayRecurringTasks.map((t) => t.id) },
          },
        })
      : [];

  const completionMap = new Map(
    todayRecurringCompletions.map((c) => [c.recurringTaskId, c.completed])
  );

  const regularCompleted = dailyTasks.filter((t) => t.completed).length;
  const recurringCompleted = todayRecurringTasks.filter(
    (t) => completionMap.get(t.id)
  ).length;
  const completedCount = regularCompleted + recurringCompleted;
  const totalCount = dailyTasks.length + todayRecurringTasks.length;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Todo任务
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          {tab === "daily" &&
            `本日已完成 ${completedCount}/${totalCount} 个任务`}
          {tab === "recurring" &&
            `共 ${allRecurringTasks.length} 个长期任务`}
        </p>
      </section>

      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map((t) => (
          <a
            key={t.key}
            href={`?tab=${t.key}`}
            className={`flex-1 rounded-md px-3 py-1.5 text-center text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {tab === "daily" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">添加本日任务</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">任务标题</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="例如：言语理解 20 题"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">日期</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={formatDate(today)}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="gap-2">
                    <Plus className="h-4 w-4" />
                    添加
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">本日任务</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyTasks.length === 0 && todayRecurringTasks.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  暂无任务，添加一个开始学习吧
                </div>
              ) : (
                <ul className="space-y-2">
                  {todayRecurringTasks.length > 0 && (
                    <>
                      <li className="flex items-center gap-2 py-1">
                        <div className="h-px flex-1 bg-border" />
                        <span className="flex items-center gap-1 text-xs text-cyan-700">
                          <Repeat className="h-3 w-3" />
                          长期任务
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </li>
                      {todayRecurringTasks.map((task) => {
                        const done = completionMap.get(task.id) ?? false;
                        return (
                          <li
                            key={task.id}
                            className="flex items-center gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-accent/50"
                          >
                            <form
                              action={toggleRecurringTask}
                              className="flex items-center"
                            >
                              <input
                                type="hidden"
                                name="id"
                                value={task.id}
                              />
                              <input
                                type="hidden"
                                name="date"
                                value={formatDate(today)}
                              />
                              <button
                                type="submit"
                                className="flex-shrink-0"
                                aria-label={
                                  done ? "标记为未完成" : "标记为完成"
                                }
                              >
                                <div
                                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                    done
                                      ? "border-brand-500 bg-brand-500"
                                      : "border-muted-foreground/40"
                                  }`}
                                >
                                  {done && (
                                    <svg
                                      className="h-3 w-3 text-white"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                    >
                                      <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                  )}
                                </div>
                              </button>
                            </form>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium ${
                                  done
                                    ? "text-muted-foreground line-through"
                                    : "text-foreground"
                                }`}
                              >
                                {task.title}
                              </p>
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

                  {todayRecurringTasks.length > 0 && (
                    <li className="flex items-center gap-2 py-1">
                      <div className="h-px flex-1 bg-border" />
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ListTodo className="h-3 w-3" />
                        普通任务
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </li>
                  )}

                  {dailyTasks.map((task) => {
                    return (
                      <li
                        key={task.id}
                        className="flex items-center gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-accent/50"
                      >
                        <form
                          action={toggleTask}
                          className="flex items-center"
                        >
                          <input
                            type="hidden"
                            name="id"
                            value={task.id}
                          />
                          <button
                            type="submit"
                            className="flex-shrink-0"
                            aria-label={
                              task.completed
                                ? "标记为未完成"
                                : "标记为完成"
                            }
                          >
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                task.completed
                                  ? "border-brand-500 bg-brand-500"
                                  : "border-muted-foreground/40"
                              }`}
                            >
                              {task.completed && (
                                <svg
                                  className="h-3 w-3 text-white"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                >
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                              )}
                            </div>
                          </button>
                        </form>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              task.completed
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            }`}
                          >
                            {task.title}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDate(task.createdAt)} {formatTime(task.createdAt)}
                        </span>
                        <DeleteTaskButton
                          taskId={task.id}
                          taskTitle={task.title}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <JournalCard
            title="每日一记"
            description="记录今天的学习心得、收获或感悟"
            defaultValue={dailyJournal?.content ?? ""}
            dateStr={formatDate(today)}
          />
        </>
      )}

      {tab === "recurring" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Repeat className="h-5 w-5 text-brand-500" />
              长期任务
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              长期任务会在设定的星期几自动同步到本日任务，每天独立记录完成状态
            </p>
          </CardHeader>
          <CardContent>
            <RecurringTaskManager
              tasks={allRecurringTasks.map((t) => ({
                id: t.id,
                title: t.title,
                daysOfWeek: t.daysOfWeek,
              }))}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}