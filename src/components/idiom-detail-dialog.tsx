"use client";

import { useEffect, useState } from "react";
import { Heart, X, StickyNote, Check, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export interface IdiomDetailItem {
  id: string;
  word: string;
  pinyin: string | null;
  abbr?: string | null;
  explanation: string | null;
  similar: string | null;
  opposite: string | null;
  usage: string | null;
  example?: string | null;
  count?: number;
  isCustom: boolean;
  isFrequent?: boolean;
}

export function parseList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[、，,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type SaveState = "idle" | "saving" | "saved";

export function IdiomDetailDialog({
  idiom,
  isFavorited,
  onToggleFavorite,
  onClose,
}: {
  idiom: IdiomDetailItem;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
}) {
  const pinyin = idiom.pinyin || undefined;
  const abbr = idiom.abbr || undefined;
  const explanation = idiom.explanation || undefined;
  const example = idiom.example || undefined;
  const similar = parseList(idiom.similar);
  const opposite = parseList(idiom.opposite);
  const usage = idiom.usage || undefined;

  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [noteLoading, setNoteLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    let cancelled = false;
    setNoteLoading(true);
    setSaveState("idle");
    const params = new URLSearchParams();
    if (idiom.isCustom) {
      params.set("customIdiomId", idiom.id);
    } else {
      params.set("idiomId", idiom.id);
    }
    fetch(`/api/idioms/notes?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : { content: "" }))
      .then((data) => {
        if (!cancelled) {
          setNote(data.content || "");
          setSavedNote(data.content || "");
          setNoteLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setNoteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [idiom.id, idiom.isCustom]);

  const saveNote = async () => {
    const content = note;
    const body = idiom.isCustom
      ? { customIdiomId: idiom.id, content }
      : { idiomId: idiom.id, content };
    setSaveState("saving");
    try {
      const res = await fetch("/api/idioms/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSavedNote(content);
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1500);
      }
    } catch (e) {
      console.error("保存备注失败", e);
      setSaveState("idle");
    }
  };

  const handleNoteChange = (value: string) => {
    setNote(value);
    setSaveState("idle");
  };

  const handleClose = () => {
    if (note !== savedNote) {
      saveNote();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b p-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="text-2xl font-bold">{idiom.word}</h3>
              {idiom.isCustom && (
                <Badge
                  variant="outline"
                  className="h-5 border-brand-300 bg-brand-50 px-1.5 text-[11px] font-medium text-brand-700"
                >
                  自定义
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {pinyin && <span>{pinyin}</span>}
              {pinyin && abbr && <span className="text-border">·</span>}
              {abbr && (
                <span className="font-mono tracking-wider text-brand-600">
                  {abbr.toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={onToggleFavorite}
              className={`rounded-md p-1.5 transition-colors ${
                isFavorited
                  ? "text-rose-500 hover:bg-rose-50"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              title={isFavorited ? "取消收藏" : "收藏"}
            >
              <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
            </button>
            <button
              onClick={handleClose}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4 text-sm">
          {explanation && (
            <div>
              <p className="font-semibold text-foreground">释义</p>
              <p className="mt-1 leading-relaxed text-muted-foreground">
                {explanation}
              </p>
            </div>
          )}

          {example && (
            <div>
              <p className="font-semibold text-foreground">例句</p>
              <p className="mt-1 leading-relaxed text-muted-foreground">
                {example}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {similar.length > 0 && (
              <div>
                <p className="font-semibold text-emerald-700">近义词</p>
                <p className="mt-0.5 text-emerald-600">{similar.join("、")}</p>
              </div>
            )}
            {opposite.length > 0 && (
              <div>
                <p className="font-semibold text-rose-700">反义词</p>
                <p className="mt-0.5 text-rose-600">{opposite.join("、")}</p>
              </div>
            )}
          </div>

          {usage && (
            <div>
              <p className="font-semibold text-foreground">用法</p>
              <p className="mt-0.5 text-muted-foreground">{usage}</p>
            </div>
          )}

          <div className="border-t pt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-1.5 font-semibold text-foreground">
                <StickyNote className="h-4 w-4 text-amber-500" />
                我的备注
              </p>
              {saveState === "saving" && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  保存中...
                </span>
              )}
              {saveState === "saved" && (
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <Check className="h-3 w-3" />
                  已保存
                </span>
              )}
            </div>
            {noteLoading ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                加载备注...
              </div>
            ) : (
              <Textarea
                value={note}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="记录你对这个成语的理解、易错点或例句..."
                rows={3}
                className="resize-y"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}