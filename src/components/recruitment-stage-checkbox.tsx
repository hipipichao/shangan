"use client";

import { useState } from "react";
import { Check } from "lucide-react";

type Stage = "registration" | "admissionTicket" | "writtenExam" | "interview";

interface StageCheckboxProps {
  recruitmentId: string;
  stage: Stage;
  done: boolean;
  label: string;
  dateText: string;
}

export function StageCheckbox({
  recruitmentId,
  stage,
  done: initialDone,
  label,
  dateText,
}: StageCheckboxProps) {
  const [done, setDone] = useState(initialDone);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    if (pending) return;
    const next = !done;
    setDone(next);
    setPending(true);
    try {
      await fetch(`/api/recruitments/${recruitmentId}/stages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, done: next }),
      });
    } catch {
      setDone(!next);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex w-full items-center gap-2 text-left transition-opacity hover:opacity-80"
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          done
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-muted-foreground/40 bg-transparent"
        }`}
      >
        {done && <Check className="h-3 w-3" />}
      </span>
      <span
        className={`text-sm ${
          done ? "text-muted-foreground line-through" : "text-foreground"
        }`}
      >
        {label}：
      </span>
      <span
        className={`text-sm font-medium ${
          done ? "text-muted-foreground line-through" : "text-foreground"
        }`}
      >
        {dateText}
      </span>
    </button>
  );
}