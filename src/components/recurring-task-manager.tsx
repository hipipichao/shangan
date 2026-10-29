"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { RecurringTaskForm } from "@/components/recurring-task-form";
import { deleteRecurringTask } from "@/lib/recurring-tasks/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";

const WEEKDAY_LABELS: Record<string, string> = {
  "1": "周一",
  "2": "周二",
  "3": "周三",
  "4": "周四",
  "5": "周五",
  "6": "周六",
  "7": "周日",
};

interface RecurringTask {
  id: string;
  title: string;
  daysOfWeek: string;
}

export function RecurringTaskManager({
  tasks,
}: {
  tasks: RecurringTask[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    const formData = new FormData();
    formData.append("id", id);
    startTransition(async () => {
      await deleteRecurringTask(formData);
      setDeletingId(null);
    });
  };

  if (tasks.length === 0 && !showAddForm) {
    return (
      <div className="space-y-4">
        <div className="py-12 text-center text-muted-foreground">
          暂无长期任务，添加一个让学习更规律吧
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full rounded-md border border-dashed border-input px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent"
        >
          + 添加长期任务
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showAddForm && (
        <div className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">新建长期任务</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <RecurringTaskForm onSaved={() => setShowAddForm(false)} />
        </div>
      )}

      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full rounded-md border border-dashed border-input px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent"
        >
          + 添加长期任务
        </button>
      )}

      <ul className="space-y-2">
        {tasks.map((task) => {
          const dayLabels = task.daysOfWeek
            .split(",")
            .filter(Boolean)
            .map((d) => WEEKDAY_LABELS[d] ?? d)
            .join("、");
          const isEditing = editingId === task.id;
          return (
            <li
              key={task.id}
              className="rounded-lg border border-border/60 p-3"
            >
              {isEditing ? (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">编辑任务</h3>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <RecurringTaskForm
                    initialId={task.id}
                    initialTitle={task.title}
                    initialDays={task.daysOfWeek}
                    onSaved={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      每周 {dayLabels} 重复
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => setEditingId(task.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      aria-label="编辑"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(task.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={deletingId !== null}
        title="删除长期任务"
        description="确定要删除此长期任务吗？此操作不可撤销。"
        confirmText={isPending ? "删除中..." : "删除"}
        onConfirm={() => deletingId && handleDelete(deletingId)}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}