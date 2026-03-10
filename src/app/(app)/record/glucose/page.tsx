"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Delete } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GlucoseRangeBadge } from "@/components/shared/GlucoseRangeBadge";
import { useRecordsStore } from "@/stores/records-store";
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
  const addGlucoseRecord = useRecordsStore((s) => s.addGlucoseRecord);

  const [display, setDisplay] = useState("");
  const [timing, setTiming] = useState<GlucoseTiming>("fasting");
  const [source, setSource] = useState<GlucoseSource>("manual");
  const [note, setNote] = useState("");

  const numValue = display ? parseInt(display, 10) : 0;

  const handleNumberPress = (n: string) => {
    if (display.length >= 3) return;
    setDisplay((prev) => prev + n);
  };

  const handleDelete = () => {
    setDisplay((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (numValue < 20 || numValue > 600) {
      toast.error("혈당값은 20~600 mg/dL 범위로 입력해 주세요");
      return;
    }
    addGlucoseRecord({
      value: numValue,
      measured_at: new Date().toISOString(),
      source,
      timing,
      note: note.trim() || null,
    });
    toast.success("혈당이 기록되었습니다");
    router.back();
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
          disabled={numValue === 0}
          className="h-14 rounded-xl bg-teal-500 text-white text-base font-semibold disabled:opacity-40 active:bg-teal-600 transition-colors"
        >
          완료
        </button>
      </div>

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={numValue === 0}
        className="w-full h-12 bg-teal-500 hover:bg-teal-600 text-white text-base font-semibold rounded-xl mt-auto"
      >
        기록하기
      </Button>
    </div>
  );
}
