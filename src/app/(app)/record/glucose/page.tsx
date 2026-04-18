"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Delete } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GlucoseRangeBadge } from "@/components/shared/GlucoseRangeBadge";
import { TextRecordInput } from "@/components/shared/TextRecordInput";
import { useSync } from "@/components/shared/SupabaseSyncProvider";
import type { GlucoseTiming, GlucoseSource } from "@/types/database";
import { cn } from "@/lib/utils";

const timingOptions: { value: GlucoseTiming; label: string }[] = [
  { value: "fasting", label: "공복" },
  { value: "before_meal", label: "식전" },
  { value: "after_meal", label: "식후" },
  { value: "before_exercise", label: "운동전" },
  { value: "after_exercise", label: "운동후" },
  { value: "before_sleep", label: "취침전" },
];

const sourceOptions: { value: GlucoseSource; label: string }[] = [
  { value: "manual", label: "직접측정" },
  { value: "cgm", label: "CGM" },
];

export default function GlucoseRecordPage() {
  const router = useRouter();
  const { addGlucoseRecord } = useSync();

  const [display, setDisplay] = useState("");
  const [timing, setTiming] = useState<GlucoseTiming>("fasting");
  const [source, setSource] = useState<GlucoseSource>("manual");
  const [note, setNote] = useState("");
  const [recordTime, setRecordTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const numValue = display ? parseInt(display, 10) : 0;

  const handleNumberPress = (n: string) => {
    if (display.length >= 3) return;
    setDisplay((prev) => prev + n);
  };

  const handleDelete = () => {
    setDisplay((prev) => prev.slice(0, -1));
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (numValue < 20 || numValue > 600) {
      toast.error("혈당값은 20~600 mg/dL 범위로 입력해 주세요");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      await addGlucoseRecord({
        value: numValue,
        measured_at: new Date(recordTime).toISOString(),
        source,
        timing,
        note: note.trim() || null,
      });
      toast.success("혈당이 기록되었습니다");
      router.back();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-4 flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-xl font-bold">혈당 기록</h1>
      </div>

      {/* AI Text Input */}
      <div className="mb-4">
        <TextRecordInput
          type="glucose"
          placeholder="예: 공복혈당 120"
          examples={["공복혈당 110", "식후 180", "취침전 혈당 95"]}
          onParsed={(data) => {
            const d = data as { value?: number; timing?: string; source?: string; note?: string };
            if (d.value) setDisplay(String(d.value));
            if (d.timing) setTiming(d.timing as GlucoseTiming);
            if (d.source) setSource(d.source as GlucoseSource);
            if (d.note) setNote(d.note);
            toast.success("텍스트에서 혈당 정보를 인식했어요!");
          }}
        />
      </div>

      {/* Display */}
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="text-6xl font-bold tabular-nums min-h-[72px]">
          {display || (
            <span className="text-muted-foreground/40">---</span>
          )}
        </div>
        <span className="text-sm text-muted-foreground">mg/dL</span>
        {numValue > 0 && <GlucoseRangeBadge value={numValue} />}
      </div>

      {/* Timing selector */}
      <div className="mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {timingOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTiming(opt.value)}
              className={cn(
                "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                timing === opt.value
                  ? "bg-teal-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Source toggle */}
      <div className="flex gap-2 mb-4">
        {sourceOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSource(opt.value)}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
              source === opt.value
                ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                : "bg-muted text-muted-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Date/Time */}
      <div className="mb-4">
        <label className="text-sm font-medium text-muted-foreground block mb-1">측정 시간</label>
        <input
          type="datetime-local"
          value={recordTime}
          onChange={(e) => setRecordTime(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border bg-background text-sm"
        />
      </div>

      {/* Note */}
      <Textarea
        placeholder="메모 (선택)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="mb-4 resize-none"
        rows={2}
      />

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => handleNumberPress(String(n))}
            className="h-14 rounded-xl bg-muted text-xl font-semibold active:bg-muted/70 transition-colors"
          >
            {n}
          </button>
        ))}
        <button
          onClick={handleDelete}
          className="h-14 rounded-xl bg-muted flex items-center justify-center active:bg-muted/70 transition-colors"
        >
          <Delete className="size-5" />
        </button>
        <button
          onClick={() => handleNumberPress("0")}
          className="h-14 rounded-xl bg-muted text-xl font-semibold active:bg-muted/70 transition-colors"
        >
          0
        </button>
        <button
          onClick={handleSubmit}
          disabled={numValue === 0 || submitting}
          className="h-14 rounded-xl bg-teal-500 text-white text-base font-semibold disabled:opacity-40 active:bg-teal-600 transition-colors"
        >
          {submitting ? "저장 중..." : "완료"}
        </button>
      </div>

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={numValue === 0 || submitting}
        className="w-full h-12 bg-teal-500 hover:bg-teal-600 text-white text-base font-semibold rounded-xl mt-auto"
      >
        {submitting ? "저장 중..." : "기록하기"}
      </Button>
    </div>
  );
}
