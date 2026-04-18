"use client";

import { useState } from "react";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TextRecordInputProps {
  type: "glucose" | "insulin" | "meal" | "exercise" | "mood";
  placeholder: string;
  onParsed: (data: Record<string, unknown>) => void;
  examples: string[];
}

export function TextRecordInput({ type, placeholder, onParsed, examples }: TextRecordInputProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleParse() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/record/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), type }),
      });

      if (!res.ok) throw new Error("분석 실패");

      const data = await res.json();
      const record = data.records?.[type];

      if (!record) {
        setError("텍스트에서 기록을 인식하지 못했어요. 다시 입력해보세요.");
        return;
      }

      onParsed(record);
      setText("");
      setOpen(false);
    } catch {
      setError("분석에 실패했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 text-sm hover:bg-violet-100 dark:hover:bg-violet-950/40 transition-colors"
      >
        <Sparkles className="size-4" />
        <span>텍스트로 빠르게 입력</span>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/20 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-violet-600 dark:text-violet-400 flex items-center gap-1">
          <Sparkles className="size-3" />
          AI 텍스트 입력
        </span>
        <button onClick={() => { setOpen(false); setText(""); setError(null); }}>
          <X className="size-4 text-muted-foreground" />
        </button>
      </div>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[60px] rounded-lg border border-border bg-background p-3 pr-11 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleParse();
            }
          }}
        />
        <button
          onClick={handleParse}
          disabled={!text.trim() || loading}
          className={cn(
            "absolute bottom-2 right-2 size-8 rounded-full flex items-center justify-center transition-colors",
            text.trim() && !loading
              ? "bg-violet-500 text-white hover:bg-violet-600"
              : "bg-muted text-muted-foreground"
          )}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <div className="flex flex-wrap gap-1">
        {examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => setText(ex)}
            className="text-[11px] px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 hover:bg-violet-200 transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
