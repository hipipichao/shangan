"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Plus, X } from "lucide-react";
import {
  createRecurringTasks,
  updateRecurringTask,
} from "@/lib/recurring-tasks/actions";

const WEEKDAY_LABELS = [
  { value: "1", label: "周一" },
  { value: "2", label: "周二" },
  { value: "3", label: "周三" },
  { value: "4", label: "周四" },
  { value: "5", label: "周五" },
  { value: "6", label: "周六" },
  { value: "7", label: "周日" },
];

interface RecurringTaskFormProps {
  initialId?: string;
  initialTitle?: string;
  initialDays?: string;
  onSaved?: () => void;
}

export function RecurringTaskForm({
  initialId,
  initialTitle = "",
  initialDays = "",
  onSaved,
}: RecurringTaskFormProps) {
  const isEdit = !!initialId;
  const [titles, setTitles] = useState<string[]>([initialTitle]);
  const [days, setDays] = useState<string[]>(
    initialDays ? initialDays.split(",").filter(Boolean) : []
  );
  const [isPending, startTransition] = useTransition();

  const toggleDay = (day: string) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const updateTitle = (index: number, value: string) => {
    setTitles((prev) => prev.map((t, i) => (i === index ? value : t)));
  };

  const addTitle = () => setTitles((prev) => [...prev, ""]);

  const removeTitle = (index: number) => {
    setTitles((prev) => prev.filter((_, i) => i !== index));
  };

  const hasValidTitle = titles.some((t) => t.trim().length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasValidTitle || days.length === 0) return;

    const daysStr = [...days].sort().join(",");

    startTransition(async () => {
      if (isEdit) {
        const formData = new FormData();
        formData.append("id", initialId!);
        formData.append("title", titles[0]?.trim() || "");
        formData.append("daysOfWeek", daysStr);
        await updateRecurringTask(formData);
      } else {
        const formData = new FormData();
        titles.forEach((t) => {
          const trimmed = t.trim();
          if (trimmed) formData.append("titles", trimmed);
        });
        formData.append("daysOfWeek", daysStr);
        await createRecurringTasks(formData);
        setTitles([""]);
        setDays([]);
      }
      onSaved?.();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        {titles.map((title, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => updateTitle(index, e.target.value)}
              placeholder="任务标题"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
            {!isEdit && (
              <>
                <button
                  type="button"
                  onClick={addTitle}
                  title="再添加一个任务"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                </button>
                {titles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTitle(index)}
                    title="移除该任务"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs text-muted-foreground">重复日期（可多选）</p>
        <div className="flex flex-wrap gap-2">
          {WEEKDAY_LABELS.map((w) => {
            const active = days.includes(w.value);
            return (
              <button
                key={w.value}
                type="button"
                onClick={() => toggleDay(w.value)}
                className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium transition-colors ${
                  active
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-input bg-background text-foreground hover:bg-accent"
                }`}
              >
                {active && <CheckCircle2 className="mr-1 h-3 w-3" />}
                {w.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || !hasValidTitle || days.length === 0}
          className="inline-flex h-9 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          {isPending
            ? "保存中..."
            : isEdit
            ? "保存修改"
            : `添加${titles.filter((t) => t.trim()).length > 1 ? "全部" : ""}`}
        </button>
      </div>
    </form>
  );
}