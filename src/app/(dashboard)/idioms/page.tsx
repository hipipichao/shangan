"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  Search,
  Brain,
  Plus,
  X,
  Loader2,
  Sparkles,
  Trash2,
  Heart,
  BookMarked,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth/client";
import { IdiomDetailItem, IdiomDetailDialog, parseList } from "@/components/idiom-detail-dialog";
import Link from "next/link";

type IdiomItem = IdiomDetailItem;

type Tab = "search" | "frequent" | "favorites";

const FREQUENT_PAGE_SIZE = 50;

function IdiomRow({
  idiom,
  onClick,
  onDeleteCustom,
}: {
  idiom: IdiomItem;
  onClick: () => void;
  onDeleteCustom?: () => void;
}) {
  const pinyin = idiom.pinyin || undefined;
  const explanation = idiom.explanation || undefined;

  return (
    <div className="border-b border-border/50 py-1 last:border-b-0">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/50"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-base font-bold text-foreground">{idiom.word}</span>
            {pinyin && (
              <span className="text-sm text-muted-foreground">{pinyin}</span>
            )}
            {idiom.isFrequent && (
              <Badge
                variant="outline"
                className="h-5 border-indigo-300 bg-indigo-50 px-1.5 text-[11px] font-medium text-indigo-700"
              >
                考
              </Badge>
            )}
            {idiom.isCustom && (
              <Badge
                variant="outline"
                className="h-5 border-brand-300 bg-brand-50 px-1.5 text-[11px] font-medium text-brand-700"
              >
                添加
              </Badge>
            )}
            {idiom.count != null && (
              <Badge
                variant="outline"
                className="h-5 border-amber-300 bg-amber-50 px-1.5 text-[11px] font-medium text-amber-700"
              >
                出现 {idiom.count} 次
              </Badge>
            )}
          </div>
          {explanation && (
            <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
              {explanation}
            </p>
          )}
        </div>
        {idiom.isCustom && onDeleteCustom && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteCustom();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onDeleteCustom();
              }
            }}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
            title="删除"
          >
            <Trash2 className="h-4 w-4" />
          </span>
        )}
      </button>
    </div>
  );
}

export default function IdiomsPage() {
  const [tab, setTab] = useState<Tab>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IdiomItem[]>([]);
  const [frequentList, setFrequentList] = useState<IdiomItem[]>([]);
  const [frequentLoading, setFrequentLoading] = useState(true);
  const [frequentPage, setFrequentPage] = useState(1);
  const [favorites, setFavorites] = useState<IdiomItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [popularList, setPopularList] = useState<IdiomItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIdiom, setSelectedIdiom] = useState<IdiomItem | null>(null);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addWord, setAddWord] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [genResult, setGenResult] = useState<{
    pinyin: string;
    explanation: string;
    similar: string;
    opposite: string;
    usage: string;
    example: string;
  } | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadFrequent = useCallback(async () => {
    setFrequentLoading(true);
    try {
      const res = await fetch("/api/idioms/frequent");
      if (res.ok) {
        const data: IdiomItem[] = await res.json();
        setFrequentList(data);
        setFrequentPage(1);
      }
    } catch (e) {
      console.error("加载高频成语失败", e);
    } finally {
      setFrequentLoading(false);
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      const res = await fetch("/api/idioms/favorites");
      if (res.ok) {
        const data: IdiomItem[] = await res.json();
        setFavorites(data);
        setFavoriteIds(new Set(data.map((i) => i.id)));
      }
    } catch (e) {
      console.error("加载收藏失败", e);
    }
  }, []);

  const loadPopular = useCallback(async () => {
    try {
      const res = await fetch("/api/idioms/popular");
      if (res.ok) {
        const data = await res.json();
        setPopularList(data.items || []);
      }
    } catch (e) {
      console.error("加载热门成语失败", e);
    }
  }, []);

  useEffect(() => {
    loadFrequent();
    loadFavorites();
    loadPopular();
  }, [loadFrequent, loadFavorites, loadPopular]);

  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      setSelectedIdiom(null);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    setSelectedIdiom(null);
    try {
      const res = await fetch(`/api/idioms/lookup?q=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data: IdiomItem[] = await res.json();
        setResults(data);
      }
    } catch (e) {
      console.error("搜索失败", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const trackSearch = useCallback(async (word: string) => {
    const { data: session } = await authClient.getSession();
    if (!session?.user) return;
    await fetch("/api/idioms/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab !== "search") return;
    const q = query.trim();
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!q) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    searchTimerRef.current = setTimeout(() => {
      doSearch(q);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [query, tab, doSearch]);

  const toggleFavorite = useCallback(
    async (idiom: IdiomItem) => {
      const { data: session } = await authClient.getSession();
      if (!session?.user) {
        window.location.href = `/login?redirect=${encodeURIComponent("/idioms")}`;
        return;
      }

      const isFav = favoriteIds.has(idiom.id);
      const body = idiom.isCustom
        ? { customIdiomId: idiom.id }
        : { idiomId: idiom.id };

      try {
        await fetch("/api/idioms/favorites", {
          method: isFav ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (isFav) {
          setFavoriteIds((prev) => {
            const next = new Set(prev);
            next.delete(idiom.id);
            return next;
          });
          setFavorites((prev) => prev.filter((i) => i.id !== idiom.id));
        } else {
          setFavoriteIds((prev) => new Set(prev).add(idiom.id));
          setFavorites((prev) => [idiom, ...prev]);
        }
      } catch (e) {
        console.error("收藏操作失败", e);
      }
    },
    [favoriteIds]
  );

  const handleGenerate = async () => {
    if (!addWord.trim()) return;
    setGenerating(true);
    setGenError("");
    setGenResult(null);
    try {
      const res = await fetch("/api/idioms/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: addWord.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error || "生成失败");
        return;
      }
      setGenResult({
        pinyin: data.pinyin || "",
        explanation: data.explanation || "",
        similar: (data.similar || []).join("、"),
        opposite: (data.opposite || []).join("、"),
        usage: data.usage || "",
        example: data.example || "",
      });
    } catch (e) {
      setGenError("网络错误，请重试");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveCustom = async () => {
    if (!addWord.trim() || !genResult) return;
    try {
      const res = await fetch("/api/idioms/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: addWord.trim(),
          pinyin: genResult.pinyin,
          explanation: genResult.explanation,
          similar: genResult.similar,
          opposite: genResult.opposite,
          usage: genResult.usage,
          example: genResult.example,
        }),
      });
      if (res.ok) {
        setShowAddDialog(false);
        setAddWord("");
        setGenResult(null);
        if (tab === "search") {
          doSearch(query);
        }
      }
    } catch (e) {
      console.error("保存失败", e);
    }
  };

  const handleDeleteCustom = async (id: string) => {
    try {
      await fetch("/api/idioms/custom", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setResults((prev) => prev.filter((i) => !(i.isCustom && i.id === id)));
      setFavorites((prev) => prev.filter((i) => !(i.isCustom && i.id === id)));
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setSelectedIdiom((prev) => (prev?.id === id ? null : prev));
    } catch (e) {
      console.error("删除失败", e);
    }
  };

  const handleDownloadPdf = async () => {
    const { data: session } = await authClient.getSession();

    if (!session?.user) {
      window.location.href = `/login?redirect=${encodeURIComponent("/idioms")}`;
      return;
    }

    window.location.href = "/api/idioms-pdf";
  };

  const frequentTotalPages = Math.max(
    1,
    Math.ceil(frequentList.length / FREQUENT_PAGE_SIZE)
  );
  const pagedFrequent = frequentList.slice(
    (frequentPage - 1) * FREQUENT_PAGE_SIZE,
    frequentPage * FREQUENT_PAGE_SIZE
  );

  const displayList =
    tab === "search" ? results : tab === "frequent" ? pagedFrequent : favorites;

  useEffect(() => {
    if (frequentPage > frequentTotalPages) {
      setFrequentPage(frequentTotalPages);
    }
  }, [frequentPage, frequentTotalPages]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">成语学习</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          公考成语大全，支持按成语、拼音、首字母或释义搜索，可添加收藏并进行练习
        </p>
      </div>

      <div className="flex gap-1 border-b">
        <button
          onClick={() => setTab("search")}
          className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === "search"
              ? "border-brand-500 text-brand-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className="h-4 w-4" />
          搜索
        </button>
        <button
          onClick={() => setTab("frequent")}
          className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === "frequent"
              ? "border-brand-500 text-brand-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          高频
        </button>
        <button
          onClick={() => setTab("favorites")}
          className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === "favorites"
              ? "border-brand-500 text-brand-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart className="h-4 w-4" />
          收藏
          {favorites.length > 0 && (
            <span className="ml-0.5 rounded-full bg-brand-100 px-1.5 text-xs text-brand-700">
              {favorites.length}
            </span>
          )}
        </button>
      </div>

      {tab === "search" && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索成语、拼音、首字母或释义..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          {popularList.length > 0 && !query.trim() && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">热门成语：</span>
              {popularList.slice(0, 10).map((idiom) => (
                <button
                  key={idiom.id}
                  onClick={() => setQuery(idiom.word)}
                  className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-sm text-brand-700 transition-colors hover:bg-brand-100"
                >
                  {idiom.word}
                  {idiom.count != null && idiom.count > 1 && (
                    <span className="ml-1 text-xs text-brand-400">{idiom.count}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "frequent" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-auto text-sm text-muted-foreground">
            共 {frequentList.length} 个高频成语
          </span>
          <Button onClick={handleDownloadPdf} size="sm" className="h-9">
            <Download className="mr-1.5 h-4 w-4" />
            下载PDF
          </Button>
        </div>
      )}

      {tab === "favorites" && (
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-9">
            <Link href="/idioms/practice">
              <Brain className="mr-1.5 h-4 w-4" />
              收藏练习
            </Link>
          </Button>
        </div>
      )}

      {tab === "search" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-auto text-sm text-muted-foreground">
            {hasSearched && !loading && `${results.length} 条结果`}
          </span>
        </div>
      )}

      <Card>
        <CardContent className="px-4 py-2">
          {tab === "search" && loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              搜索中...
            </div>
          ) : tab === "search" && !hasSearched ? (
            <div className="py-16 text-center">
              <Search className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-4 text-sm text-muted-foreground">
                输入关键词开始搜索成语
              </p>
            </div>
          ) : tab === "frequent" && frequentLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              加载中...
            </div>
          ) : displayList.length === 0 ? (
            <div className="py-16 text-center">
              {tab === "search" ? (
                <>
                  <p className="text-sm text-muted-foreground">未找到匹配的成语</p>
                  <Button
                    onClick={() => {
                      setAddWord(query.trim());
                      setShowAddDialog(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    添加成语「{query.trim()}」
                  </Button>
                </>
              ) : tab === "frequent" ? (
                <p className="text-sm text-muted-foreground">暂无高频成语数据</p>
              ) : (
                <>
                  <BookMarked className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    还没有收藏任何成语
                  </p>
                  <Button
                    onClick={() => setTab("search")}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    <Search className="mr-1.5 h-4 w-4" />
                    去搜索收藏
                  </Button>
                </>
              )}
            </div>
          ) : (
            displayList.map((idiom) => (
              <IdiomRow
                key={idiom.id}
                idiom={idiom}
                onClick={() => {
                  setSelectedIdiom(idiom);
                  trackSearch(idiom.word).then(loadPopular);
                }}
                onDeleteCustom={
                  idiom.isCustom ? () => handleDeleteCustom(idiom.id) : undefined
                }
              />
            ))
          )}
        </CardContent>
      </Card>

      {tab === "frequent" && frequentTotalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFrequentPage((p) => Math.max(1, p - 1))}
            disabled={frequentPage === 1}
            className="h-8"
          >
            <ChevronLeft className="h-4 w-4" />
            上一页
          </Button>
          <span className="px-2 text-sm text-muted-foreground">
            {frequentPage} / {frequentTotalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setFrequentPage((p) => Math.min(frequentTotalPages, p + 1))
            }
            disabled={frequentPage === frequentTotalPages}
            className="h-8"
          >
            下一页
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {selectedIdiom && (
        <IdiomDetailDialog
          idiom={selectedIdiom}
          isFavorited={favoriteIds.has(selectedIdiom.id)}
          onToggleFavorite={() => toggleFavorite(selectedIdiom)}
          onClose={() => setSelectedIdiom(null)}
        />
      )}

      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="text-lg font-semibold">添加成语</h3>
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setGenResult(null);
                  setGenError("");
                }}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
              {!genResult ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="add-word">成语</Label>
                    <Input
                      id="add-word"
                      value={addWord}
                      onChange={(e) => setAddWord(e.target.value)}
                      placeholder="输入要添加的成语"
                    />
                  </div>
                  {genError && (
                    <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {genError}
                    </div>
                  )}
                  <Button
                    onClick={handleGenerate}
                    disabled={generating || !addWord.trim()}
                    className="w-full"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        AI 生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        AI 生成成语信息
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>成语</Label>
                      <Input value={addWord} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>拼音</Label>
                      <Input
                        value={genResult.pinyin}
                        onChange={(e) =>
                          setGenResult({ ...genResult, pinyin: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>释义</Label>
                      <Textarea
                        value={genResult.explanation}
                        onChange={(e) =>
                          setGenResult({
                            ...genResult,
                            explanation: e.target.value,
                          })
                        }
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>近义词（用、分隔）</Label>
                      <Input
                        value={genResult.similar}
                        onChange={(e) =>
                          setGenResult({ ...genResult, similar: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>反义词（用、分隔）</Label>
                      <Input
                        value={genResult.opposite}
                        onChange={(e) =>
                          setGenResult({ ...genResult, opposite: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>用法</Label>
                      <Input
                        value={genResult.usage}
                        onChange={(e) =>
                          setGenResult({ ...genResult, usage: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>例句</Label>
                      <Textarea
                        value={genResult.example}
                        onChange={(e) =>
                          setGenResult({ ...genResult, example: e.target.value })
                        }
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setGenResult(null)}
                      className="flex-1"
                    >
                      重新生成
                    </Button>
                    <Button onClick={handleSaveCustom} className="flex-1">
                      保存
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}