"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Send,
  Droplets,
  Syringe,
  UtensilsCrossed,
  Dumbbell,
  Heart,
  Check,
  X,
  MessageSquareText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSync } from "@/components/shared/SupabaseSyncProvider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ParsedRecords {
  glucose: {
    value: number;
    timing: string;
    source: string;
    note: string | null;
  } | null;
  insulin: {
    insulin_name: string;
    insulin_type: string;
    dose: number;
    injection_site: string;
    note: string | null;
  } | null;
  meal: {
    meal_type: string;
    total_carbs: number;
    total_calories: number | null;
    note: string | null;
  } | null;
  exercise: {
    exercise_type: string;
    duration_minutes: number;
    intensity: string;
    calories_burned: number | null;
    carb_supplement: number | null;
    note: string | null;
  } | null;
  mood: {
    mood: string;
    stress_level: number;
    factors: string[];
    note: string | null;
  } | null;
}

const timingLabels: Record<string, string> = {
  fasting: "공복",
  before_meal: "식전",
  after_meal: "식후",
  before_exercise: "운동 전",
  after_exercise: "운동 후",
  before_sleep: "취침 전",
};

const mealTypeLabels: Record<string, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

const exerciseTypeLabels: Record<string, string> = {
  weight: "웨이트",
  cardio: "유산소",
  swimming: "수영",
  dance: "댄스",
  martial_arts: "격투기",
  yoga: "요가",
  walking: "걷기",
  cycling: "자전거",
  other: "기타",
};

const intensityLabels: Record<string, string> = {
  low: "가벼움",
  moderate: "보통",
  high: "격렬",
};

const moodLabels: Record<string, string> = {
  great: "최고 😄",
  good: "좋음 😊",
  neutral: "보통 😐",
  bad: "나쁨 😔",
  terrible: "최악 😢",
};

const siteLabels: Record<string, string> = {
  abdomen: "배",
  thigh: "허벅지",
  arm: "팔",
  hip: "엉덩이",
};

const exampleTexts = [
  "아침 공복혈당 110, 노보래피드 4단위 배에 맞고 밥이랑 된장찌개 먹음",
  "점심에 김치볶음밥 먹고 30분 걸었어 기분 좋음",
  "저녁 식후혈당 180, 트레시바 10단위",
  "간식으로 사과 하나 먹음 컨디션 보통",
];

export default function SmartRecordPage() {
  const router = useRouter();
  const sync = useSync();
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsed, setParsed] = useState<ParsedRecords | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  async function handleParse() {
    if (!text.trim() || parsing) return;
    setParsing(true);
    setParsed(null);
    setSummary("");
    setSelected({});
    setSaved(false);

    try {
      const res = await fetch("/api/record/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!res.ok) throw new Error("분석 실패");

      const data = await res.json();
      const records = data.records as ParsedRecords;
      setParsed(records);
      setSummary(data.summary || "");

      // Auto-select all recognized records
      const sel: Record<string, boolean> = {};
      if (records.glucose) sel.glucose = true;
      if (records.insulin) sel.insulin = true;
      if (records.meal) sel.meal = true;
      if (records.exercise) sel.exercise = true;
      if (records.mood) sel.mood = true;
      setSelected(sel);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "분석에 실패했어요. 다시 시도해주세요");
    } finally {
      setParsing(false);
    }
  }

  async function handleSave() {
    if (!parsed || saving) return;
    setSaving(true);

    const now = new Date();
    const isoNow = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    ).toISOString().slice(0, 16);

    let count = 0;

    try {
      if (selected.glucose && parsed.glucose) {
        await sync.addGlucoseRecord({
          value: parsed.glucose.value,
          measured_at: isoNow,
          source: parsed.glucose.source || "manual",
          timing: parsed.glucose.timing || "fasting",
          note: parsed.glucose.note || "[AI 텍스트 인식]",
        });
        count++;
      }

      if (selected.insulin && parsed.insulin) {
        await sync.addInsulinRecord({
          insulin_name: parsed.insulin.insulin_name,
          insulin_type: parsed.insulin.insulin_type || "rapid",
          dose: parsed.insulin.dose,
          injected_at: isoNow,
          injection_site: parsed.insulin.injection_site || "abdomen",
          note: parsed.insulin.note || "[AI 텍스트 인식]",
        });
        count++;
      }

      if (selected.meal && parsed.meal) {
        await sync.addMealRecord({
          meal_type: parsed.meal.meal_type || "lunch",
          eaten_at: isoNow,
          total_carbs: parsed.meal.total_carbs,
          total_calories: parsed.meal.total_calories,
          photo_url: null,
          note: parsed.meal.note || "[AI 텍스트 인식]",
        });
        count++;
      }

      if (selected.exercise && parsed.exercise) {
        await sync.addExerciseRecord({
          exercise_type: parsed.exercise.exercise_type || "other",
          duration_minutes: parsed.exercise.duration_minutes,
          intensity: parsed.exercise.intensity || "moderate",
          steps: null,
          calories_burned: parsed.exercise.calories_burned,
          started_at: isoNow,
          glucose_before: null,
          glucose_after: null,
          carb_supplement: parsed.exercise.carb_supplement,
          note: parsed.exercise.note || "[AI 텍스트 인식]",
        });
        count++;
      }

      if (selected.mood && parsed.mood) {
        await sync.addMoodRecord({
          mood: parsed.mood.mood || "neutral",
          stress_level: parsed.mood.stress_level || 3,
          factors: parsed.mood.factors || [],
          note: parsed.mood.note || "[AI 텍스트 인식]",
          recorded_at: isoNow,
        });
        count++;
      }

      setSaved(true);
      toast.success(`${count}건의 기록이 저장되었습니다`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장에 실패했어요. 다시 시도해주세요");
    } finally {
      setSaving(false);
    }
  }

  function toggleSelect(key: string) {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="py-4 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="size-5 text-violet-500" />
            종합 기록
          </h1>
          <p className="text-xs text-muted-foreground">
            텍스트로 입력하면 AI가 자동 분류해요
          </p>
        </div>
      </div>

      {/* Text Input */}
      <div className="relative mb-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="예: 아침 공복혈당 110, 노보래피드 4단위 맞고 밥이랑 김치찌개 먹었어"
          className="w-full min-h-[120px] rounded-2xl border border-border bg-background p-4 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          disabled={parsing || saved}
        />
        <button
          onClick={handleParse}
          disabled={!text.trim() || parsing || saved}
          className={cn(
            "absolute bottom-3 right-3 size-10 rounded-full flex items-center justify-center transition-colors",
            text.trim() && !parsing && !saved
              ? "bg-violet-500 text-white hover:bg-violet-600"
              : "bg-muted text-muted-foreground"
          )}
        >
          {parsing ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Send className="size-5" />
          )}
        </button>
      </div>

      {/* Example chips */}
      {!parsed && !parsing && (
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <MessageSquareText className="size-3" />
            이렇게 입력해보세요
          </p>
          <div className="flex flex-wrap gap-1.5">
            {exampleTexts.map((ex, i) => (
              <button
                key={i}
                onClick={() => setText(ex)}
                className="text-xs px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-950/50 transition-colors"
              >
                {ex.length > 25 ? ex.slice(0, 25) + "..." : ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Parsing animation */}
      {parsing && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="relative">
            <Sparkles className="size-10 text-violet-500 animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">AI가 텍스트를 분석하고 있어요...</p>
        </div>
      )}

      {/* Parsed Results */}
      {parsed && !parsing && (
        <div className="space-y-3">
          {summary && (
            <div className="bg-violet-50 dark:bg-violet-950/30 rounded-xl px-4 py-3">
              <p className="text-sm text-violet-700 dark:text-violet-300">
                <Sparkles className="size-3.5 inline mr-1" />
                {summary}
              </p>
            </div>
          )}

          {/* Glucose */}
          {parsed.glucose && (
            <RecordCard
              selected={!!selected.glucose}
              onToggle={() => toggleSelect("glucose")}
              icon={<Droplets className="size-5" />}
              color="teal"
              title="혈당"
              disabled={saved}
            >
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{parsed.glucose.value}</span>
                <span className="text-xs text-muted-foreground">mg/dL</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
                {timingLabels[parsed.glucose.timing] || parsed.glucose.timing}
              </span>
            </RecordCard>
          )}

          {/* Insulin */}
          {parsed.insulin && (
            <RecordCard
              selected={!!selected.insulin}
              onToggle={() => toggleSelect("insulin")}
              icon={<Syringe className="size-5" />}
              color="blue"
              title="인슐린"
              disabled={saved}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold">{parsed.insulin.insulin_name}</span>
                <span className="text-2xl font-bold">{parsed.insulin.dose}<span className="text-sm">U</span></span>
              </div>
              <span className="text-xs text-muted-foreground">
                {siteLabels[parsed.insulin.injection_site] || parsed.insulin.injection_site}
              </span>
            </RecordCard>
          )}

          {/* Meal */}
          {parsed.meal && (
            <RecordCard
              selected={!!selected.meal}
              onToggle={() => toggleSelect("meal")}
              icon={<UtensilsCrossed className="size-5" />}
              color="orange"
              title="식단"
              disabled={saved}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                  {mealTypeLabels[parsed.meal.meal_type] || parsed.meal.meal_type}
                </span>
                <span className="text-lg font-bold">{parsed.meal.total_carbs}g</span>
                {parsed.meal.total_calories && (
                  <span className="text-xs text-muted-foreground">{parsed.meal.total_calories}kcal</span>
                )}
              </div>
              {parsed.meal.note && (
                <p className="text-xs text-muted-foreground mt-0.5">{parsed.meal.note}</p>
              )}
            </RecordCard>
          )}

          {/* Exercise */}
          {parsed.exercise && (
            <RecordCard
              selected={!!selected.exercise}
              onToggle={() => toggleSelect("exercise")}
              icon={<Dumbbell className="size-5" />}
              color="green"
              title="운동"
              disabled={saved}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">
                  {exerciseTypeLabels[parsed.exercise.exercise_type] || parsed.exercise.exercise_type}
                </span>
                <span className="text-sm">{parsed.exercise.duration_minutes}분</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                  {intensityLabels[parsed.exercise.intensity] || parsed.exercise.intensity}
                </span>
              </div>
            </RecordCard>
          )}

          {/* Mood */}
          {parsed.mood && (
            <RecordCard
              selected={!!selected.mood}
              onToggle={() => toggleSelect("mood")}
              icon={<Heart className="size-5" />}
              color="pink"
              title="기분"
              disabled={saved}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">
                  {moodLabels[parsed.mood.mood] || parsed.mood.mood}
                </span>
                <span className="text-xs text-muted-foreground">
                  스트레스 {parsed.mood.stress_level}/5
                </span>
              </div>
            </RecordCard>
          )}

          {/* No records found */}
          {!parsed.glucose && !parsed.insulin && !parsed.meal && !parsed.exercise && !parsed.mood && (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <X className="size-8 mb-2 opacity-30" />
              <p className="text-sm">인식된 기록이 없어요</p>
              <p className="text-xs mt-1">다시 입력해보세요</p>
            </div>
          )}

          {/* Save / New buttons */}
          {selectedCount > 0 && !saved && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-base font-bold mt-4"
            >
              {saving ? (
                <>
                  <Loader2 className="size-5 animate-spin mr-2" />
                  저장 중...
                </>
              ) : (
                <>
                  <Check className="size-5 mr-2" />
                  {selectedCount}건 저장하기
                </>
              )}
            </Button>
          )}

          {saved && (
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-center gap-2 py-3 text-green-600">
                <Check className="size-5" />
                <span className="font-bold">저장 완료!</span>
              </div>
              <Button
                onClick={() => {
                  setText("");
                  setParsed(null);
                  setSummary("");
                  setSelected({});
                  setSaved(false);
                }}
                variant="outline"
                className="w-full h-10 rounded-xl"
              >
                새로 입력하기
              </Button>
              <Button
                onClick={() => router.push("/record")}
                variant="ghost"
                className="w-full h-10 rounded-xl"
              >
                기록 메뉴로 돌아가기
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RecordCard({
  selected,
  onToggle,
  icon,
  color,
  title,
  disabled,
  children,
}: {
  selected: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  color: string;
  title: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const colorMap: Record<string, { bg: string; border: string; iconBg: string }> = {
    teal: {
      bg: "bg-teal-50 dark:bg-teal-950/30",
      border: "border-teal-300 dark:border-teal-700",
      iconBg: "bg-teal-500",
    },
    blue: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-300 dark:border-blue-700",
      iconBg: "bg-blue-500",
    },
    orange: {
      bg: "bg-orange-50 dark:bg-orange-950/30",
      border: "border-orange-300 dark:border-orange-700",
      iconBg: "bg-orange-500",
    },
    green: {
      bg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-300 dark:border-green-700",
      iconBg: "bg-green-500",
    },
    pink: {
      bg: "bg-pink-50 dark:bg-pink-950/30",
      border: "border-pink-300 dark:border-pink-700",
      iconBg: "bg-pink-500",
    },
  };

  const c = colorMap[color] || colorMap.teal;

  return (
    <button
      onClick={disabled ? undefined : onToggle}
      className={cn(
        "w-full rounded-xl border-2 p-4 text-left transition-all",
        selected ? `${c.bg} ${c.border}` : "bg-muted/30 border-transparent opacity-50",
        disabled && "pointer-events-none"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("rounded-full p-2 text-white shrink-0", c.iconBg)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
          {children}
        </div>
        <div
          className={cn(
            "size-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1",
            selected ? `${c.border} ${c.iconBg}` : "border-muted-foreground/30"
          )}
        >
          {selected && <Check className="size-3.5 text-white" />}
        </div>
      </div>
    </button>
  );
}
