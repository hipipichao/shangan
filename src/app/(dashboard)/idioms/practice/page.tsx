"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowLeft,
  Volume2,
  VolumeX,
  Heart,
  CircleDashed,
  Trash2,
  Brain,
  Flame,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth/client";
import {
  IdiomDetailItem,
  IdiomDetailDialog,
} from "@/components/idiom-detail-dialog";

type PracticeIdiom = IdiomDetailItem & {
  ease: number;
  interval: number;
  repetitions: number;
  lapses: number;
  dueDate: string;
  lastReviewedAt: string | null;
  lastGrade: number;
};

interface OptionIdiom {
  id: string;
  word: string;
  pinyin: string | null;
  explanation: string | null;
}

interface Question {
  idiom: PracticeIdiom;
  options: { text: string; correct: boolean }[];
}

type PracticeMode = "review" | "reinforce" | "new";

const FAST_RESPONSE_MS = 3000;
const RETRY_GAP = 3;

function lastSentence(text: string | null): string {
  if (!text) return "";
  const parts = text.split(/([。！？；])/);
  const segments: string[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const content = parts[i]?.trim() ?? "";
    const punct = parts[i + 1] ?? "";
    if (content) segments.push(content + punct);
  }
  if (segments.length === 0) return text;
  return segments[segments.length - 1];
}

function pickWeightedIdiom(
  pool: PracticeIdiom[],
  excludeIds: Set<string>,
  mode: PracticeMode
): PracticeIdiom | null {
  const now = Date.now();
  const candidates = pool.filter(
    (i) => i.explanation && !excludeIds.has(i.id)
  );
  if (candidates.length === 0) return null;

  const weights = candidates.map((i) => {
    const dueTime = new Date(i.dueDate).getTime();
    const overdueDays = Math.max(0, (now - dueTime) / (24 * 60 * 60 * 1000));
    const isDue = dueTime <= now;
    const isSoon = dueTime <= now + 24 * 60 * 60 * 1000;

    let baseWeight = 0.3;
    if (isDue) baseWeight = 10;
    else if (isSoon) baseWeight = 3;

    const urgencyFactor = 1 + Math.min(overdueDays, 7) * 0.5;
    const difficultyFactor = 1 + Math.min(i.lapses, 5) * 0.4;

    let modeFactor = 1;
    if (mode === "reinforce") {
      modeFactor = i.lapses > 0 ? 3 : 0.3;
    } else if (mode === "new") {
      modeFactor = i.repetitions === 0 ? 5 : 0.1;
    }

    return baseWeight * urgencyFactor * difficultyFactor * modeFactor;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < candidates.length; i++) {
    random -= weights[i];
    if (random <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

function buildQuestion(
  favoritesPool: PracticeIdiom[],
  optionPool: OptionIdiom[],
  excludeIds: Set<string>,
  retryQueue: { idiomId: string; afterCount: number }[],
  answeredCount: number,
  mode: PracticeMode
): Question | null {
  let idiom: PracticeIdiom | null = null;

  const dueRetry = retryQueue.find((r) => r.afterCount <= answeredCount);
  if (dueRetry) {
    idiom =
      favoritesPool.find((i) => i.id === dueRetry.idiomId && i.explanation) ??
      null;
  }

  if (!idiom) {
    idiom = pickWeightedIdiom(favoritesPool, excludeIds, mode);
  }

  if (!idiom) return null;

  const wrongPool = optionPool.filter(
    (i) => i.word !== idiom!.word && i.explanation
  );
  const shuffled = [...wrongPool].sort(() => Math.random() - 0.5);
  const wrongs = shuffled.slice(0, 3);

  const options = [
    { text: lastSentence(idiom.explanation), correct: true },
    ...wrongs.map((w) => ({
      text: lastSentence(w.explanation),
      correct: false,
    })),
  ].sort(() => Math.random() - 0.5);

  return { idiom, options };
}

function playTone(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = "sine"
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    ctx.currentTime + start + duration
  );
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration);
}

function playCorrectSound(ctx: AudioContext) {
  playTone(ctx, 523.25, 0, 0.12, "sine");
  playTone(ctx, 659.25, 0.1, 0.12, "sine");
  playTone(ctx, 783.99, 0.2, 0.2, "sine");
}

function playWrongSound(ctx: AudioContext) {
  playTone(ctx, 311.13, 0, 0.18, "square");
  playTone(ctx, 233.08, 0.16, 0.28, "square");
}

function gradeFromResult(isCorrect: boolean, responseMs: number): number {
  if (!isCorrect) return 1;
  return responseMs < FAST_RESPONSE_MS ? 5 : 3;
}

export default function IdiomPracticePage() {
  const [pool, setPool] = useState<PracticeIdiom[]>([]);
  const [optionPool, setOptionPool] = useState<OptionIdiom[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [retryQueue, setRetryQueue] = useState<
    { idiomId: string; afterCount: number }[]
  >([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [mode, setMode] = useState<PracticeMode>("review");
  const [muted, setMuted] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dueCount, setDueCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const questionStartTimeRef = useRef<number>(0);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const loadData = useCallback(async () => {
    const { data: session } = await authClient.getSession();
    if (!session?.user) {
      window.location.href = `/login?redirect=${encodeURIComponent(
        "/idioms/practice"
      )}`;
      return;
    }
    setLoading(true);
    try {
      const [favRes, poolRes] = await Promise.all([
        fetch("/api/idioms/practice"),
        fetch("/api/idioms/pool"),
      ]);
      if (favRes.ok) {
        const data = await favRes.json();
        const items: PracticeIdiom[] = data.items ?? [];
        setPool(items);
        setDueCount(data.dueCount ?? 0);
        if (poolRes.ok) {
          const poolData: OptionIdiom[] = await poolRes.json();
          setOptionPool(poolData);
          if (items.length >= 1 && poolData.length >= 3) {
            const q = buildQuestion(
              items,
              poolData,
              new Set(),
              [],
              0,
              "review"
            );
            setQuestion(q);
            if (q) questionStartTimeRef.current = Date.now();
          }
        }
      }
    } catch (e) {
      console.error("加载练习数据失败", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const submitGrade = useCallback(
    async (idiom: PracticeIdiom, grade: number) => {
      try {
        const body = idiom.isCustom
          ? { customIdiomId: idiom.id, grade }
          : { idiomId: idiom.id, grade };
        await fetch("/api/idioms/practice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch (e) {
        console.error("提交练习结果失败", e);
      }
    },
    []
  );

  const nextQuestion = useCallback(() => {
    const newAnsweredCount = answeredCount + 1;
    setAnsweredCount(newAnsweredCount);

    const q = buildQuestion(
      pool,
      optionPool,
      doneIds,
      retryQueue,
      newAnsweredCount,
      mode
    );

    if (!q) {
      setSessionComplete(true);
      setQuestion(null);
      return;
    }

    if (retryQueue.some((r) => r.idiomId === q.idiom.id)) {
      setRetryQueue((prev) => prev.filter((r) => r.idiomId !== q.idiom.id));
    }

    setQuestion(q);
    setSelectedIndex(null);
    setAnswered(false);
    setShowDetail(false);
    questionStartTimeRef.current = Date.now();
  }, [pool, optionPool, doneIds, retryQueue, answeredCount, mode]);

  const handleSelect = (index: number) => {
    if (answered || !question) return;
    setSelectedIndex(index);
    setAnswered(true);

    const isCorrect = question.options[index].correct;
    const responseMs = Date.now() - questionStartTimeRef.current;
    const grade = gradeFromResult(isCorrect, responseMs);

    submitGrade(question.idiom, grade);

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setDoneIds((prev) => {
        const next = new Set(prev);
        next.add(question.idiom.id);
        return next;
      });
      setRetryQueue((prev) =>
        prev.filter((r) => r.idiomId !== question.idiom.id)
      );
      if (!muted) {
        try {
          playCorrectSound(getAudioCtx());
        } catch {
          /* ignore audio errors */
        }
      }
    } else {
      setWrongCount((c) => c + 1);
      setRetryQueue((prev) => {
        if (prev.some((r) => r.idiomId === question.idiom.id)) return prev;
        return [
          ...prev,
          {
            idiomId: question.idiom.id,
            afterCount: answeredCount + RETRY_GAP,
          },
        ];
      });
      if (!muted) {
        try {
          playWrongSound(getAudioCtx());
        } catch {
          /* ignore audio errors */
        }
      }
    }
  };

  const removeFavorite = useCallback(async () => {
    if (!question || removing) return;
    setRemoving(true);
    try {
      const body = question.idiom.isCustom
        ? { customIdiomId: question.idiom.id }
        : { idiomId: question.idiom.id };
      const res = await fetch("/api/idioms/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const newPool = pool.filter((i) => i.id !== question.idiom.id);
        setPool(newPool);
        setDoneIds((prev) => {
          const next = new Set(prev);
          next.delete(question.idiom.id);
          return next;
        });
        setRetryQueue((prev) =>
          prev.filter((r) => r.idiomId !== question.idiom.id)
        );
        setShowDetail(false);
        if (newPool.length >= 1 && optionPool.length >= 3) {
          const q = buildQuestion(
            newPool,
            optionPool,
            doneIds,
            retryQueue.filter((r) => r.idiomId !== question.idiom.id),
            answeredCount,
            mode
          );
          setQuestion(q);
          setSelectedIndex(null);
          setAnswered(false);
          if (q) questionStartTimeRef.current = Date.now();
        } else {
          setQuestion(null);
        }
      }
    } catch (e) {
      console.error("移除收藏失败", e);
    } finally {
      setRemoving(false);
    }
  }, [question, removing, pool, optionPool, doneIds, retryQueue, answeredCount, mode]);

  const restartSession = () => {
    setDoneIds(new Set());
    setRetryQueue([]);
    setAnsweredCount(0);
    setCorrectCount(0);
    setWrongCount(0);
    setSessionComplete(false);
    setSelectedIndex(null);
    setAnswered(false);
    const q = buildQuestion(pool, optionPool, new Set(), [], 0, mode);
    setQuestion(q);
    if (q) questionStartTimeRef.current = Date.now();
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (pool.length < 1) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/idioms">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回成语学习
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Heart className="h-12 w-12 text-muted-foreground/40" />
            <h2 className="mt-4 text-lg font-semibold">暂无收藏成语</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              请先收藏至少 1 个成语才能开始练习。
            </p>
            <Button asChild className="mt-6">
              <Link href="/idioms">
                <Heart className="mr-2 h-4 w-4" />
                去收藏成语
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (optionPool.length < 3) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">成语库数据不足，无法生成练习</p>
      </div>
    );
  }

  if (sessionComplete) {
    const total = correctCount + wrongCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/idioms">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回成语学习
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Sparkles className="h-12 w-12 text-brand-500" />
            <h2 className="mt-4 text-lg font-semibold">本轮练习完成</h2>
            <div className="mt-6 flex gap-8">
              <div>
                <p className="text-3xl font-bold text-emerald-600">
                  {correctCount}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">答对</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-500">{wrongCount}</p>
                <p className="mt-1 text-xs text-muted-foreground">答错</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-brand-600">{accuracy}%</p>
                <p className="mt-1 text-xs text-muted-foreground">正确率</p>
              </div>
            </div>
            <Button onClick={restartSession} className="mt-8">
              <RefreshCw className="mr-2 h-4 w-4" />
              再来一轮
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  const isCorrect =
    selectedIndex !== null && question.options[selectedIndex].correct;

  const remainingCount = Math.max(0, pool.length - doneIds.size);

  const modeButton = (m: PracticeMode, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      className={cn(
        "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        mode === m
          ? "bg-brand-600 text-white"
          : "bg-muted text-muted-foreground hover:bg-muted/70"
      )}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Link href="/idioms">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" />
              返回成语学习
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMuted((m) => !m)}
            title={muted ? "开启声音" : "关闭声音"}
          >
            {muted ? (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Volume2 className="h-4 w-4 text-foreground" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2">
          {modeButton("review", "复习", <Brain className="h-3.5 w-3.5" />)}
          {modeButton("reinforce", "强化", <Flame className="h-3.5 w-3.5" />)}
          {modeButton("new", "新词", <Sparkles className="h-3.5 w-3.5" />)}
          {dueCount > 0 && (
            <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
              {dueCount} 个待复习
            </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-muted-foreground/60">答对</span>
            <span className="font-medium text-foreground">{correctCount}</span>
            <span className="text-muted-foreground/60">个</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-muted-foreground/60">答错</span>
            <span className="font-medium text-foreground">{wrongCount}</span>
            <span className="text-muted-foreground/60">个</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CircleDashed className="h-4 w-4 text-blue-500" />
            <span className="text-muted-foreground/60">剩余</span>
            <span className="font-medium text-foreground">{remainingCount}</span>
            <span className="text-muted-foreground/60">个</span>
          </span>
        </div>
      </div>

      <Card className="border-brand-200 bg-gradient-to-br from-brand-50/50 to-white">
        <CardContent className="p-4 sm:p-8">
          <p className="text-center text-sm text-muted-foreground">
            {answered ? "点击成语查看详情" : "请选择该成语的正确释义"}
          </p>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => answered && setShowDetail(true)}
              className={cn(
                "text-3xl font-bold tracking-wider text-foreground transition-colors sm:text-4xl",
                answered && "cursor-pointer hover:text-brand-600 hover:underline"
              )}
              disabled={!answered}
            >
              {question.idiom.word}
            </button>
            {question.idiom.pinyin && (
              <p className="mt-2 text-base text-muted-foreground">
                {question.idiom.pinyin}
              </p>
            )}
            {question.idiom.lapses > 0 && (
              <p className="mt-2 text-xs text-amber-600">
                已错 {question.idiom.lapses} 次，本次需重点掌握
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {question.options.map((opt, i) => {
          const showCorrect = answered && opt.correct;
          const showWrong = answered && selectedIndex === i && !opt.correct;
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={answered}
              className={cn(
                "w-full rounded-lg border-2 p-3 text-left transition-all sm:p-4",
                !answered && "hover:border-brand-400 hover:bg-brand-50/50 cursor-pointer",
                answered && "cursor-default",
                showCorrect && "border-emerald-500 bg-emerald-50",
                showWrong && "border-red-500 bg-red-50",
                !showCorrect && !showWrong && answered && "border-border opacity-60"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                    showCorrect
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : showWrong
                        ? "border-red-500 bg-red-500 text-white"
                        : "border-border text-muted-foreground"
                  )}
                >
                  {showCorrect ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : showWrong ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    String.fromCharCode(65 + i)
                  )}
                </span>
                <span
                  className={cn(
                    "flex-1 text-sm leading-relaxed",
                    showCorrect && "text-emerald-700 font-medium",
                    showWrong && "text-red-700"
                  )}
                >
                  {opt.text}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          className={cn(
            "rounded-lg border p-4",
            isCorrect
              ? "border-emerald-200 bg-emerald-50"
              : "border-red-200 bg-red-50"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span
                className={cn(
                  "font-semibold",
                  isCorrect ? "text-emerald-700" : "text-red-700"
                )}
              >
                {isCorrect ? "回答正确！" : "回答错误"}
              </span>
              {isCorrect && (
                <span className="text-xs text-muted-foreground">
                  下次复习：
                  {question.idiom.interval > 0
                    ? `${question.idiom.interval} 天后`
                    : "明天"}
                </span>
              )}
              {!isCorrect && (
                <span className="text-xs text-muted-foreground">
                  将在本轮稍后再次出现
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={removeFavorite}
              disabled={removing}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
              {removing ? "移除中..." : "移除收藏"}
            </button>
          </div>
          {question.idiom.usage && (
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-semibold">用法：</span>
              {question.idiom.usage}
            </p>
          )}
        </div>
      )}

      <div className="flex justify-center">
        <Button
          onClick={nextQuestion}
          disabled={!answered}
          className="w-full sm:w-auto"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          下一题
        </Button>
      </div>

      {showDetail && question && (
        <IdiomDetailDialog
          idiom={question.idiom}
          isFavorited={pool.some((i) => i.id === question.idiom.id)}
          onToggleFavorite={removeFavorite}
          onClose={() => setShowDetail(false)}
        />
      )}
    </div>
  );
}