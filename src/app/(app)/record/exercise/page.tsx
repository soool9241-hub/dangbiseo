"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Dumbbell,
  Heart,
  Waves,
  Music,
  Swords,
  Flower2,
  Footprints,
  Bike,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { isToday, isYesterday, format, subDays, isAfter } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { NumberStepper } from "@/components/shared/NumberStepper";
import { useSync } from "@/components/shared/SupabaseSyncProvider";
import { TextRecordInput } from "@/components/shared/TextRecordInput";
import type {
  ExerciseType,
  ExerciseIntensity,
} from "@/types/database";
import { cn } from "@/lib/utils";
import { useRecordsStore } from "@/stores/records-store";

const exerciseTypes: {
  value: ExerciseType;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "웨이트", label: "웨이트", icon: Dumbbell },
  { value: "유산소", label: "유산소", icon: Heart },
  { value: "수영", label: "수영", icon: Waves },
  { value: "댄스", label: "댄스", icon: Music },
  { value: "격투기", label: "격투기", icon: Swords },
  { value: "요가", label: "요가", icon: Flower2 },
  { value: "걷기", label: "걷기", icon: Footprints },
  { value: "자전거", label: "자전거", icon: Bike },
  { value: "기타", label: "기타", icon: MoreHorizontal },
];

const intensities: { value: ExerciseIntensity; label: string }[] = [
  { value: "low", label: "가벼움" },
  { value: "moderate", label: "보통" },
  { value: "high", label: "격렬" },
];

function getGuideText(
  type: ExerciseType,
  intensity: ExerciseIntensity,
  duration: number
): string | null {
  if (type === "수영") {
    return "CGM 연결이 끊길 수 있어요";
  }
  if (intensity === "high") {
    return "운동 전 혈당 확인 필수";
  }
  if (
    (type === "유산소" || type === "걷기" || type === "자전거") &&
    duration >= 30
  ) {
    return "20-30g 탄수화물 보충 권장";
  }
  return null;
}

const intensityLabels: Record<string, string> = {
  low: "가벼움",
  moderate: "보통",
  high: "격렬",
};

function ExerciseDashboard() {
  const { exerciseRecords } = useRecordsStore();
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
    return exerciseRecords
      .filter((r) => isAfter(new Date(r.started_at), cutoff))
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  }, [exerciseRecords, period]);

  const stats = useMemo(() => {
    const totalDuration = filteredRecords.reduce((s, r) => s + (r.duration_minutes || 0), 0);
    const totalCalories = filteredRecords.reduce((s, r) => s + (r.calories_burned || 0), 0);
    return { totalDuration, totalCalories, count: filteredRecords.length };
  }, [filteredRecords]);

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
                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                : "bg-muted text-muted-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalDuration}분</div>
          <div className="text-xs text-muted-foreground">총 운동 시간</div>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalCalories}</div>
          <div className="text-xs text-muted-foreground">총 소모 칼로리</div>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.count}</div>
          <div className="text-xs text-muted-foreground">운동 횟수</div>
        </div>
      </div>

      {/* Records list */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          해당 기간에 기록이 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRecords.map((record) => (
            <div key={record.id} className="bg-muted rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{formatTime(record.started_at)}</span>
                  <span className="text-sm font-medium">{record.exercise_type}</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                    {intensityLabels[record.intensity] || record.intensity}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-semibold text-green-600 dark:text-green-400">{record.duration_minutes}분</span>
                {record.calories_burned != null && record.calories_burned > 0 && (
                  <span className="text-muted-foreground">{record.calories_burned} kcal</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExerciseRecordPage() {
  const router = useRouter();
  const { addExerciseRecord } = useSync();

  const [viewMode, setViewMode] = useState<"record" | "dashboard">("record");
  const [exerciseType, setExerciseType] = useState<ExerciseType>("유산소");
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState<ExerciseIntensity>("moderate");
  const [glucoseBefore, setGlucoseBefore] = useState("");
  const [glucoseAfter, setGlucoseAfter] = useState("");
  const [carbSupplement, setCarbSupplement] = useState(0);
  const [note, setNote] = useState("");
  const [recordTime, setRecordTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const guideText = getGuideText(exerciseType, intensity, duration);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await addExerciseRecord({
        exercise_type: exerciseType,
        duration_minutes: duration,
        intensity,
        steps: null,
        calories_burned: null,
        started_at: new Date(recordTime).toISOString(),
        glucose_before: glucoseBefore ? parseInt(glucoseBefore, 10) : null,
        glucose_after: glucoseAfter ? parseInt(glucoseAfter, 10) : null,
        carb_supplement: carbSupplement > 0 ? carbSupplement : null,
        note: note.trim() || null,
      });
      toast.success("운동이 기록되었습니다");
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
        <h1 className="text-xl font-bold">운동 기록</h1>
      </div>

      {/* View mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode("record")}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
            viewMode === "record"
              ? "bg-green-500 text-white"
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
              ? "bg-green-500 text-white"
              : "bg-muted text-muted-foreground"
          )}
        >
          기록 보기
        </button>
      </div>

      {viewMode === "dashboard" ? (
        <ExerciseDashboard />
      ) : (
      <>
      {/* AI Text Input */}
      <TextRecordInput
        type="exercise"
        placeholder="예: 30분 걸었어"
        examples={["30분 걸었어", "헬스 1시간 격렬", "수영 45분", "자전거 20분"]}
        onParsed={(data) => {
          const d = data as { exercise_type?: string; duration_minutes?: number; intensity?: string };
          if (d.exercise_type) {
            const typeMap: Record<string, ExerciseType> = {
              weight: "웨이트", cardio: "유산소", swimming: "수영", dance: "댄스",
              martial_arts: "격투기", yoga: "요가", walking: "걷기", cycling: "자전거", other: "기타",
            };
            setExerciseType(typeMap[d.exercise_type] || "기타");
          }
          if (d.duration_minutes) setDuration(d.duration_minutes);
          if (d.intensity) setIntensity(d.intensity as ExerciseIntensity);
          toast.success("텍스트에서 운동 정보를 인식했어요!");
        }}
      />

      {/* Exercise type grid */}
      <div className="space-y-2 mb-6">
        <label className="text-sm font-medium text-muted-foreground">
          운동 종류
        </label>
        <div className="grid grid-cols-3 gap-2">
          {exerciseTypes.map((et) => {
            const Icon = et.icon;
            return (
              <button
                key={et.value}
                onClick={() => setExerciseType(et.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-3 rounded-xl text-sm font-medium transition-colors",
                  exerciseType === et.value
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 ring-2 ring-green-500"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
                <span>{et.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-2 mb-6">
        <label className="text-sm font-medium text-muted-foreground">
          운동 시간
        </label>
        <div className="flex justify-center">
          <NumberStepper
            value={duration}
            onChange={setDuration}
            min={5}
            max={180}
            step={5}
            unit="분"
            size="lg"
          />
        </div>
      </div>

      {/* Intensity */}
      <div className="space-y-2 mb-6">
        <label className="text-sm font-medium text-muted-foreground">
          운동 강도
        </label>
        <div className="grid grid-cols-3 gap-2">
          {intensities.map((int) => (
            <button
              key={int.value}
              onClick={() => setIntensity(int.value)}
              className={cn(
                "py-2.5 rounded-xl text-sm font-medium transition-colors",
                intensity === int.value
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {int.label}
            </button>
          ))}
        </div>
      </div>

      {/* Guide text */}
      {guideText && (
        <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-sm px-4 py-3 rounded-xl mb-6">
          {guideText}
        </div>
      )}

      {/* Pre/post glucose */}
      <div className="space-y-2 mb-6">
        <label className="text-sm font-medium text-muted-foreground">
          혈당 (선택)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs text-muted-foreground mb-1 block">
              운동 전 혈당
            </span>
            <Input
              type="number"
              placeholder="mg/dL"
              value={glucoseBefore}
              onChange={(e) => setGlucoseBefore(e.target.value)}
            />
          </div>
          <div>
            <span className="text-xs text-muted-foreground mb-1 block">
              운동 후 혈당
            </span>
            <Input
              type="number"
              placeholder="mg/dL"
              value={glucoseAfter}
              onChange={(e) => setGlucoseAfter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Carb supplement */}
      <div className="space-y-2 mb-6">
        <label className="text-sm font-medium text-muted-foreground">
          탄수화물 보충 (선택)
        </label>
        <div className="flex justify-center">
          <NumberStepper
            value={carbSupplement}
            onChange={setCarbSupplement}
            min={0}
            max={100}
            step={5}
            unit="g"
            size="md"
          />
        </div>
      </div>

      {/* Date/Time */}
      <div className="space-y-2 mb-6">
        <label className="text-sm font-medium text-muted-foreground">운동 시작 시간</label>
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

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full h-12 bg-green-500 hover:bg-green-600 text-white text-base font-semibold rounded-xl mt-auto"
      >
        {submitting ? "저장 중..." : "기록하기"}
      </Button>
      </>
      )}
    </div>
  );
}
