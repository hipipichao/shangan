"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTask } from "@/lib/tasks/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface DeleteTaskButtonProps {
  taskId: string;
  taskTitle: string;
}

export function DeleteTaskButton({ taskId, taskTitle }: DeleteTaskButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    const formData = new FormData();
    formData.append("id", taskId);
    startTransition(async () => {
      await deleteTask(formData);
      setOpen(false);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        aria-label="删除任务"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <ConfirmDialog
        open={open}
        title="删除任务"
        description={`确定要删除任务「${taskTitle}」吗？此操作不可撤销。`}
        confirmText={isPending ? "删除中..." : "删除"}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}