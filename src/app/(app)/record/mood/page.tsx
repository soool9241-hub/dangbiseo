"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useSync } from "@/components/shared/SupabaseSyncProvider";
import type { MoodLevel } from "@/types/database";
import { cn } from "@/lib/utils";

const moodOptions: { value: MoodLevel; emoji: string; label: string }[] = [
  { value: "great", emoji: "😄", label: "최고" },
  { value: "good", emoji: "😊", label: "좋음" },
  { value: "neutral", emoji: "😐", label: "보통" },
  { value: "bad", emoji: "😔", label: "나쁨" },
  { value: "terrible", emoji: "😢", label: "최악" },
];

const factorTags = [
  "업무",
  "수면",
  "운동",
  "관계",
  "음식",
  "날씨",
  "혈당",
  "기타",
];

export default function MoodRecordPage() {
  const router = useRouter();
  const { addMoodRecord } = useSync();

  const [mood, setMood] = useState<MoodLevel | null>(null);
  const [stressLevel, setStressLevel] = useState(3);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const toggleFactor = (factor: string) => {
    setSelectedFactors((prev) =>
      prev.includes(factor)
        ? prev.filter((f) => f !== factor)
        : [...prev, factor]
    );
  };

  const handleSubmit = () => {
    if (!mood) {
      toast.error("기분을 선택해 주세요");
      return;
    }
    addMoodRecord({
      mood,
      stress_level: stressLevel,
      factors: selectedFactors,
      note: note.trim() || null,
      recorded_at: new Date().toISOString(),
    });
    toast.success("기분이 기록되었습니다");
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
        <h1 className="text-xl font-bold">기분 기록</h1>
      </div>

      {/* Mood selector */}
      <div className="space-y-2 mb-8">
        <label className="text-sm font-medium text-muted-foreground">
          지금 기분이 어때요?
        </label>
        <div className="flex justify-between gap-2">
          {moodOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMood(opt.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl flex-1 transition-all",
                mood === opt.value
                  ? "bg-pink-100 dark:bg-pink-900/40 ring-2 ring-pink-500 scale-105"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              <span className="text-3xl">{opt.emoji}</span>
              <span className="text-xs font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stress level */}
      <div className="space-y-3 mb-8">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted-foreground">
            스트레스 수준
          </label>
          <span className="text-sm font-semibold">{stressLevel} / 5</span>
        </div>
        <Slider
          value={[stressLevel]}
          onValueChange={(val) => setStressLevel(Array.isArray(val) ? val[0] : val)}
          min={1}
          max={5}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>낮음</span>
          <span>높음</span>
        </div>
      </div>

      {/* Factor tags */}
      <div className="space-y-2 mb-6">
        <label className="text-sm font-medium text-muted-foreground">
          영향을 준 요소
        </label>
        <div className="flex flex-wrap gap-2">
          {factorTags.map((factor) => (
            <button
              key={factor}
              onClick={() => toggleFactor(factor)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                selectedFactors.includes(factor)
                  ? "bg-pink-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {factor}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <Textarea
        placeholder="메모 (선택)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="mb-4 resize-none"
        rows={3}
      />

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!mood}
        className="w-full h-12 bg-pink-500 hover:bg-pink-600 text-white text-base font-semibold rounded-xl mt-auto"
      >
        기록하기
      </Button>
    </div>
  );
}
