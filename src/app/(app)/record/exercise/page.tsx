"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NumberStepper } from "@/components/shared/NumberStepper";
import { useSync } from "@/components/shared/SupabaseSyncProvider";
import type {
  ExerciseType,
  ExerciseIntensity,
} from "@/types/database";
import { cn } from "@/lib/utils";

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

export default function ExerciseRecordPage() {
  const router = useRouter();
  const { addExerciseRecord } = useSync();

  const [exerciseType, setExerciseType] = useState<ExerciseType>("유산소");
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState<ExerciseIntensity>("moderate");
  const [glucoseBefore, setGlucoseBefore] = useState("");
  const [glucoseAfter, setGlucoseAfter] = useState("");
  const [carbSupplement, setCarbSupplement] = useState(0);
  const [note, setNote] = useState("");

  const guideText = getGuideText(exerciseType, intensity, duration);

  const handleSubmit = () => {
    addExerciseRecord({
      exercise_type: exerciseType,
      duration_minutes: duration,
      intensity,
      steps: null,
      calories_burned: null,
      started_at: new Date().toISOString(),
      glucose_before: glucoseBefore ? parseInt(glucoseBefore, 10) : null,
      glucose_after: glucoseAfter ? parseInt(glucoseAfter, 10) : null,
      carb_supplement: carbSupplement > 0 ? carbSupplement : null,
      note: note.trim() || null,
    });
    toast.success("운동이 기록되었습니다");
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
        <h1 className="text-xl font-bold">운동 기록</h1>
      </div>

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
        className="w-full h-12 bg-green-500 hover:bg-green-600 text-white text-base font-semibold rounded-xl mt-auto"
      >
        기록하기
      </Button>
    </div>
  );
}
