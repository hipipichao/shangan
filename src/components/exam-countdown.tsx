"use client";

import { useEffect, useState } from "react";
import { Calendar, Printer, FileText } from "lucide-react";

const EXAM_DATE = new Date("2026-11-29T09:00:00+08:00");

type Stage = "upcoming" | "ongoing" | "past";

type TimelineItem = {
  icon: typeof Calendar;
  title: string;
  date: string;
  start: Date;
  end: Date;
};

const TIMELINE: TimelineItem[] = [
  {
    icon: FileText,
    title: "报名",
    date: "10 月 15 日 — 10 月 24 日",
    start: new Date("2026-10-15T00:00:00+08:00"),
    end: new Date("2026-10-24T23:59:59+08:00"),
  },
  {
    icon: Printer,
    title: "准考证打印",
    date: "11 月 23 日 — 11 月 29 日",
    start: new Date("2026-11-23T00:00:00+08:00"),
    end: new Date("2026-11-29T12:00:00+08:00"),
  },
  {
    icon: Calendar,
    title: "笔试",
    date: "11 月 28 日 — 11 月 29 日",
    start: new Date("2026-11-28T00:00:00+08:00"),
    end: new Date("2026-11-29T18:00:00+08:00"),
  },
];

function getStage(now: number, start: number, end: number): Stage {
  if (now < start) return "upcoming";
  if (now > end) return "past";
  return "ongoing";
}

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

const STAGE_STYLES: Record<Stage, { dot: string; text: string; label: string }> = {
  upcoming: { dot: "bg-brand-300", text: "text-brand-500", label: "即将开始" },
  ongoing: { dot: "bg-emerald-500", text: "text-emerald-600", label: "进行中" },
  past: { dot: "bg-muted-foreground/40", text: "text-muted-foreground", label: "已结束" },
};

const INITIAL_TIME: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

export function ExamCountdown() {
  const [time, setTime] = useState<TimeLeft>(INITIAL_TIME);
  const [now, setNow] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTime(getTimeLeft(EXAM_DATE));
    setNow(Date.now());
    const timer = setInterval(() => {
      setTime(getTimeLeft(EXAM_DATE));
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isExpired = mounted && time.days === 0 && time.hours === 0 && time.minutes === 0 && time.seconds === 0;

  const units: { label: string; value: number }[] = [
    { label: "天", value: time.days },
    { label: "时", value: time.hours },
    { label: "分", value: time.minutes },
    { label: "秒", value: time.seconds },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-8 text-center text-white shadow-lg">
        <p className="text-sm font-medium text-brand-100">距 2027 国家公务员考试还有</p>
        {isExpired ? (
          <p className="mt-6 text-3xl font-bold">考试进行中，祝好运！</p>
        ) : (
          <div className="mt-6 flex items-center justify-center gap-3 sm:gap-5">
            {units.map((u) => (
              <div key={u.label} className="flex flex-col items-center">
                <div className="flex h-20 w-16 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm sm:h-24 sm:w-20">
                  <span className="font-mono text-4xl font-bold tabular-nums sm:text-5xl">
                    {String(u.value).padStart(2, "0")}
                  </span>
                </div>
                <span className="mt-2 text-xs text-brand-100 sm:text-sm">{u.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-foreground">关键时间节点</p>
        <div className="space-y-3">
          {TIMELINE.map((item) => {
            const stage = getStage(now, item.start.getTime(), item.end.getTime());
            const style = STAGE_STYLES[stage];
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                  <span className={`text-xs ${style.text}`}>{style.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}