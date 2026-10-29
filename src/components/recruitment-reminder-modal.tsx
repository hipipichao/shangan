"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, AlertCircle, Clock, Calendar, Printer, BookOpen, Users } from "lucide-react";

export interface ActiveStage {
  recruitmentId: string;
  title: string;
  stage: "registration" | "admissionTicket" | "writtenExam" | "interview";
  stageLabel: string;
  deadlineText: string;
  urgent: boolean;
}

const STORAGE_KEY = "recruitment-reminder-last-shown";

const STAGE_ICONS: Record<ActiveStage["stage"], typeof Clock> = {
  registration: Clock,
  admissionTicket: Printer,
  writtenExam: BookOpen,
  interview: Users,
};

const STAGE_COLORS: Record<ActiveStage["stage"], string> = {
  registration: "text-emerald-600",
  admissionTicket: "text-indigo-600",
  writtenExam: "text-blue-600",
  interview: "text-purple-600",
};

function getTodayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function RecruitmentReminderModal({ stages }: { stages: ActiveStage[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (stages.length === 0) return;
    const lastShown = localStorage.getItem(STORAGE_KEY);
    const today = getTodayKey();
    if (lastShown !== today) {
      setOpen(true);
      localStorage.setItem(STORAGE_KEY, today);
    }
  }, [stages]);

  if (!open || stages.length === 0) return null;

  const handleClose = () => setOpen(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="关闭"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
            <AlertCircle className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold">报考日程提醒</h2>
            <p className="text-sm text-muted-foreground">
              你有 {stages.length} 个进行中的日程待完成
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {stages.map((s, idx) => {
            const Icon = STAGE_ICONS[s.stage];
            return (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-xl border border-muted bg-muted/30 p-3"
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${STAGE_COLORS[s.stage]}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.stageLabel} · {s.deadlineText}
                  </p>
                </div>
                {s.urgent && (
                  <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                    紧急
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 rounded-lg border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            知道了
          </button>
          <Link
            href="/recruitments"
            onClick={handleClose}
            className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            去查看
          </Link>
        </div>
      </div>
    </div>
  );
}