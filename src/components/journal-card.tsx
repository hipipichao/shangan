"use client";

import { useActionState, useEffect, useState } from "react";
import { saveJournal, type JournalState } from "@/lib/journals/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, CheckCircle2 } from "lucide-react";

export function JournalCard({
  title,
  description,
  defaultValue,
  dateStr,
}: {
  title: string;
  description: string;
  defaultValue: string;
  dateStr: string;
}) {
  const [state, formAction, isPending] = useActionState(saveJournal, {
    message: "",
    success: false,
  } satisfies JournalState);

  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (state.message) {
      setShowMessage(true);
      const timer = setTimeout(() => setShowMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.message]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5 text-brand-500" />
          {title}
          <span className="text-xs font-normal text-muted-foreground">
            {dateStr}
          </span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="date" value={dateStr} />
          <textarea
            name="content"
            defaultValue={defaultValue}
            rows={4}
            placeholder="写点什么吧..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
          <div className="flex items-center justify-between">
            {showMessage && state.success ? (
              <div className="flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                {state.message}
              </div>
            ) : showMessage && state.message ? (
              <div className="text-sm text-red-500">{state.message}</div>
            ) : (
              <div />
            )}
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "保存中..." : "保存"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}