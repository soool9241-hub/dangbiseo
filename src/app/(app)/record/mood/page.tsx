"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { isToday, isYesterday, format, subDays, isAfter } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useSync } from "@/components/shared/SupabaseSyncProvider";
import { TextRecordInput } from "@/components/shared/TextRecordInput";
import type { MoodLevel } from "@/types/database";
import { cn } from "@/lib/utils";
import { useRecordsStore } from "@/stores/records-store";

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

const moodEmojiMap: Record<string, { emoji: string; label: string }> = {
  great: { emoji: "😄", label: "최고" },
  good: { emoji: "😊", label: "좋음" },
  neutral: { emoji: "😐", label: "보통" },
  bad: { emoji: "😔", label: "나쁨" },
  terrible: { emoji: "😢", label: "최악" },
};

function MoodDashboard() {
  const { moodRecords } = useRecordsStore();
  const [period, setPeriod] = useState<"today" | "3d" | "7d" | "30d">("today");

  const periodOptions = [
    { value: "today" as const, label: "오늘" },
    { value: "3d" as const, label: "3일" },
    { value: "7d" as const, label: "7일" },
    { value: "30d" as const, label: "30일" },
  ];

  const filteredRecords = useMemo(() => {
    const now = new Date();
    let cutoff: Date;
    switch (period) {
      case "today":
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "3d":
        cutoff = subDays(now, 3);
        break;
      case "7d":
        cutoff = subDays(now, 7);
        break;
      case "30d":
        cutoff = subDays(now, 30);
        break;
    }
    return moodRecords
      .filter((r) => isAfter(new Date(r.recorded_at), cutoff))
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
  }, [moodRecords, period]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return `오늘 ${format(d, "HH:mm")}`;
    if (isYesterday(d)) return `어제 ${format(d, "HH:mm")}`;
    return format(d, "MM/dd HH:mm");
  };

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex gap-2">
        {periodOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
              period === opt.value
                ? "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300"
                : "bg-muted text-muted-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Records list */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          해당 기간에 기록이 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRecords.map((record) => {
            const moodInfo = moodEmojiMap[record.mood] || { emoji: "😐", label: record.mood };
            return (
              <div key={record.id} className="bg-muted rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatTime(record.recorded_at)}</span>
                    <span className="text-lg">{moodInfo.emoji}</span>
                    <span className="text-sm font-medium">{moodInfo.label}</span>
                  </div>
                  <Badge variant="secondary" className="bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">
                    스트레스 {record.stress_level}/5
                  </Badge>
                </div>
                {record.note && (
                  <p className="text-xs text-muted-foreground truncate">{record.note}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MoodRecordPage() {
  const router = useRouter();
  const { addMoodRecord } = useSync();

  const [viewMode, setViewMode] = useState<"record" | "dashboard">("record");
  const [mood, setMood] = useState<MoodLevel | null>(null);
  const [stressLevel, setStressLevel] = useState(3);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [recordTime, setRecordTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const toggleFactor = (factor: string) => {
    setSelectedFactors((prev) =>
      prev.includes(factor)
        ? prev.filter((f) => f !== factor)
        : [...prev, factor]
    );
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!mood) {
      toast.error("기분을 선택해 주세요");
      return;
    }
    setSubmitting(true);
    try {
      await addMoodRecord({
        mood,
        stress_level: stressLevel,
        factors: selectedFactors,
        note: note.trim() || null,
        recorded_at: new Date(recordTime).toISOString(),
      });
      toast.success("기분이 기록되었습니다");
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
        <h1 className="text-xl font-bold">기분 기록</h1>
      </div>

      {/* View mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode("record")}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
            viewMode === "record"
              ? "bg-pink-500 text-white"
              : "bg-muted text-muted-foreground"
          )}
        >
          기록하기
        </button>
        <button
          onClick={() => setViewMode("dashboard")}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
            viewMode === "dashboard"
              ? "bg-pink-500 text-white"
              : "bg-muted text-muted-foreground"
          )}
        >
          기록 보기
        </button>
      </div>

      {viewMode === "dashboard" ? (
        <MoodDashboard />
      ) : (
      <>
      {/* AI Text Input */}
      <div className="mb-4">
        <TextRecordInput
          type="mood"
          placeholder="예: 오늘 기분 좋아 스트레스 없음"
          examples={["기분 좋아", "컨디션 별로 스트레스 많음", "우울하고 피곤해"]}
          onParsed={(data) => {
            const d = data as { mood?: string; stress_level?: number; factors?: string[] };
            if (d.mood) setMood(d.mood as MoodLevel);
            if (d.stress_level) setStressLevel(d.stress_level);
            if (d.factors) {
              const factorMap: Record<string, string> = {
                work: "업무", sleep: "수면", exercise: "운동", relationship: "관계",
                food: "음식", weather: "날씨", glucose: "혈당", other: "기타",
              };
              setSelectedFactors(d.factors.map(f => factorMap[f] || f));
            }
            toast.success("텍스트에서 기분 정보를 인식했어요!");
          }}
        />
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

      {/* Date/Time */}
      <div className="mb-4">
        <label className="text-sm font-medium text-muted-foreground block mb-1">기록 시간</label>
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
        rows={3}
      />

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!mood || submitting}
        className="w-full h-12 bg-pink-500 hover:bg-pink-600 text-white text-base font-semibold rounded-xl mt-auto"
      >
        {submitting ? "저장 중..." : "기록하기"}
      </Button>
      </>
      )}
    </div>
  );
}
