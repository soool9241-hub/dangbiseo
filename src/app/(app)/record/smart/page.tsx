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
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSync } from "@/components/shared/SupabaseSyncProvider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Types ──

interface GlucoseItem { value: number; timing: string; source: string; note: string | null; time: string | null }
interface InsulinItem { insulin_name: string; insulin_type: string; dose: number; injection_site: string; note: string | null; time: string | null }
interface MealItem { meal_type: string; total_carbs: number; total_calories: number | null; note: string | null; time: string | null }
interface ExerciseItem { exercise_type: string; duration_minutes: number; intensity: string; calories_burned: number | null; carb_supplement: number | null; note: string | null; time: string | null }
interface MoodItem { mood: string; stress_level: number; factors: string[]; note: string | null; time: string | null }

interface ParsedRecords {
  glucose: GlucoseItem[];
  insulin: InsulinItem[];
  meal: MealItem[];
  exercise: ExerciseItem[];
  mood: MoodItem[];
}

// ── Label maps ──

const timingLabels: Record<string, string> = { fasting: "공복", before_meal: "식전", after_meal: "식후", before_exercise: "운동 전", after_exercise: "운동 후", before_sleep: "취침 전", other: "기타" };
const mealTypeLabels: Record<string, string> = { breakfast: "아침", lunch: "점심", dinner: "저녁", snack: "간식" };
const exerciseTypeLabels: Record<string, string> = { weight: "웨이트", cardio: "유산소", swimming: "수영", dance: "댄스", martial_arts: "격투기", yoga: "요가", walking: "걷기", cycling: "자전거", other: "기타" };
const intensityLabels: Record<string, string> = { low: "가벼움", moderate: "보통", high: "격렬" };
const moodLabels: Record<string, string> = { great: "최고 😄", good: "좋음 😊", neutral: "보통 😐", bad: "나쁨 😔", terrible: "최악 😢" };
const siteLabels: Record<string, string> = { abdomen: "배", thigh: "허벅지", arm: "팔", hip: "엉덩이" };

const exampleTexts = [
  "아침 7시 공복혈당 110, 노보 4단위, 밥이랑 된장찌개",
  "12시 혈당 92, 노보 20, 점심 식사, 12시25분 혈당 120",
  "새벽 12시19분 혈당 130, 7시30분 공복혈당 91, 트레시바 20",
  "오후 3시 간식 사과, 6시40분 혈당 208, 노보 20, 저녁 순두부",
];

// ── Unified timeline item ──

interface TimelineItem {
  id: string;
  type: "glucose" | "insulin" | "meal" | "exercise" | "mood";
  time: string | null;
  selected: boolean;
  data: GlucoseItem | InsulinItem | MealItem | ExerciseItem | MoodItem;
}

export default function SmartRecordPage() {
  const router = useRouter();
  const sync = useSync();
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [summary, setSummary] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [saved, setSaved] = useState(false);

  function buildTimeline(records: ParsedRecords): TimelineItem[] {
    const items: TimelineItem[] = [];
    let idx = 0;

    for (const g of records.glucose) {
      items.push({ id: `g${idx++}`, type: "glucose", time: g.time, selected: true, data: g });
    }
    for (const ins of records.insulin) {
      items.push({ id: `i${idx++}`, type: "insulin", time: ins.time, selected: true, data: ins });
    }
    for (const m of records.meal) {
      items.push({ id: `m${idx++}`, type: "meal", time: m.time, selected: true, data: m });
    }
    for (const e of records.exercise) {
      items.push({ id: `e${idx++}`, type: "exercise", time: e.time, selected: true, data: e });
    }
    for (const mo of records.mood) {
      items.push({ id: `mo${idx++}`, type: "mood", time: mo.time, selected: true, data: mo });
    }

    // Sort by time
    items.sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });

    return items;
  }

  async function handleParse() {
    if (!text.trim() || parsing) return;
    setParsing(true);
    setTimeline([]);
    setSummary("");
    setTotalCount(0);
    setSaved(false);

    try {
      // Preprocess: normalize separators for better AI parsing
      const cleaned = text.trim()
        .replace(/ㅡ/g, ", ")
        .replace(/[-–—]/g, ", ")
        .replace(/\s*,\s*,\s*/g, ", ")
        .replace(/\s{2,}/g, " ");

      const res = await fetch("/api/record/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleaned }),
      });

      if (!res.ok) throw new Error("분석 실패");

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const records = data.records as ParsedRecords;
      const items = buildTimeline(records);
      setTimeline(items);
      setSummary(data.summary || "");
      setTotalCount(data.total_count || items.length);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "분석에 실패했어요. 다시 시도해주세요");
    } finally {
      setParsing(false);
    }
  }

  function toggleItem(id: string) {
    setTimeline((prev) => prev.map((item) => item.id === id ? { ...item, selected: !item.selected } : item));
  }

  function selectAll() {
    setTimeline((prev) => prev.map((item) => ({ ...item, selected: true })));
  }

  function deselectAll() {
    setTimeline((prev) => prev.map((item) => ({ ...item, selected: false })));
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);

    const now = new Date();

    function buildIso(parsedTime: string | null | undefined): string {
      const base = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
      if (parsedTime && /^\d{2}:\d{2}$/.test(parsedTime)) {
        const [h, m] = parsedTime.split(":").map(Number);
        base.setHours(h, m, 0, 0);
      }
      return base.toISOString().slice(0, 16);
    }

    let count = 0;

    try {
      for (const item of timeline) {
        if (!item.selected) continue;

        if (item.type === "glucose") {
          const d = item.data as GlucoseItem;
          await sync.addGlucoseRecord({
            value: d.value,
            measured_at: buildIso(d.time),
            source: d.source || "manual",
            timing: d.timing || "other",
            note: d.note || "[AI 텍스트 인식]",
          });
          count++;
        } else if (item.type === "insulin") {
          const d = item.data as InsulinItem;
          await sync.addInsulinRecord({
            insulin_name: d.insulin_name,
            insulin_type: d.insulin_type || "rapid",
            dose: d.dose,
            injected_at: buildIso(d.time),
            injection_site: d.injection_site || "abdomen",
            note: d.note || "[AI 텍스트 인식]",
          });
          count++;
        } else if (item.type === "meal") {
          const d = item.data as MealItem;
          await sync.addMealRecord({
            meal_type: d.meal_type || "snack",
            eaten_at: buildIso(d.time),
            total_carbs: d.total_carbs,
            total_calories: d.total_calories,
            photo_url: null,
            note: d.note || "[AI 텍스트 인식]",
          });
          count++;
        } else if (item.type === "exercise") {
          const d = item.data as ExerciseItem;
          await sync.addExerciseRecord({
            exercise_type: d.exercise_type || "other",
            duration_minutes: d.duration_minutes,
            intensity: d.intensity || "moderate",
            steps: null,
            calories_burned: d.calories_burned,
            started_at: buildIso(d.time),
            glucose_before: null,
            glucose_after: null,
            carb_supplement: d.carb_supplement,
            note: d.note || "[AI 텍스트 인식]",
          });
          count++;
        } else if (item.type === "mood") {
          const d = item.data as MoodItem;
          await sync.addMoodRecord({
            mood: d.mood || "neutral",
            stress_level: d.stress_level || 3,
            factors: d.factors || [],
            note: d.note || "[AI 텍스트 인식]",
            recorded_at: buildIso(d.time),
          });
          count++;
        }
      }

      setSaved(true);
      toast.success(`${count}건의 기록이 저장되었습니다`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장에 실패했어요");
    } finally {
      setSaving(false);
    }
  }

  const selectedCount = timeline.filter((i) => i.selected).length;

  // Group by time for timeline display
  const timeGroups: { time: string; items: TimelineItem[] }[] = [];
  for (const item of timeline) {
    const timeKey = item.time || "시간 미지정";
    const group = timeGroups.find((g) => g.time === timeKey);
    if (group) {
      group.items.push(item);
    } else {
      timeGroups.push({ time: timeKey, items: [item] });
    }
  }

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
            하루 기록을 텍스트로 한번에 입력하세요
          </p>
        </div>
      </div>

      {/* Text Input */}
      <div className="relative mb-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"예: 새벽12시19분 혈당130, 7시30분 공복혈당91, 트레시바20, 노보20, 식사, 10시 혈당72, 버터떡1개..."}
          className="w-full min-h-[140px] rounded-2xl border border-border bg-background p-4 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50"
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
          {parsing ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
        </button>
      </div>

      {/* Example chips */}
      {!timeline.length && !parsing && (
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
                {ex.length > 30 ? ex.slice(0, 30) + "..." : ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Parsing animation */}
      {parsing && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Sparkles className="size-10 text-violet-500 animate-pulse" />
          <p className="text-sm text-muted-foreground">AI가 텍스트를 분석하고 있어요...</p>
        </div>
      )}

      {/* Timeline Results */}
      {timeline.length > 0 && !parsing && (
        <div className="space-y-4">
          {/* Summary */}
          {summary && (
            <div className="bg-violet-50 dark:bg-violet-950/30 rounded-xl px-4 py-3">
              <p className="text-sm text-violet-700 dark:text-violet-300">
                <Sparkles className="size-3.5 inline mr-1" />
                {summary}
              </p>
              <p className="text-xs text-violet-600/70 dark:text-violet-400/70 mt-1">
                총 {totalCount}건 인식 · {selectedCount}건 선택됨
              </p>
            </div>
          )}

          {/* Select controls */}
          {!saved && (
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400">전체 선택</button>
              <button onClick={deselectAll} className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">전체 해제</button>
            </div>
          )}

          {/* Time-grouped timeline */}
          {timeGroups.map((group) => (
            <div key={group.time}>
              {/* Time header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-violet-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Clock className="size-3" />
                  {group.time}
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Items */}
              <div className="space-y-2 ml-2 border-l-2 border-violet-200 dark:border-violet-800 pl-3">
                {group.items.map((item) => (
                  <TimelineCard key={item.id} item={item} onToggle={() => toggleItem(item.id)} disabled={saved} />
                ))}
              </div>
            </div>
          ))}

          {/* Save / New buttons */}
          {selectedCount > 0 && !saved && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-base font-bold mt-2"
            >
              {saving ? (
                <><Loader2 className="size-5 animate-spin mr-2" />저장 중...</>
              ) : (
                <><Check className="size-5 mr-2" />{selectedCount}건 저장하기</>
              )}
            </Button>
          )}

          {saved && (
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-center gap-2 py-3 text-green-600">
                <Check className="size-5" />
                <span className="font-bold">저장 완료!</span>
              </div>
              <Button onClick={() => { setText(""); setTimeline([]); setSummary(""); setTotalCount(0); setSaved(false); }} variant="outline" className="w-full h-10 rounded-xl">
                새로 입력하기
              </Button>
              <Button onClick={() => router.push("/record")} variant="ghost" className="w-full h-10 rounded-xl">
                기록 메뉴로 돌아가기
              </Button>
            </div>
          )}
        </div>
      )}

      {/* No results */}
      {timeline.length === 0 && !parsing && summary && (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <X className="size-8 mb-2 opacity-30" />
          <p className="text-sm">인식된 기록이 없어요</p>
          <p className="text-xs mt-1">다시 입력해보세요</p>
        </div>
      )}
    </div>
  );
}

// ── Timeline Card Component ──

const typeConfig = {
  glucose: { icon: Droplets, color: "teal", label: "혈당" },
  insulin: { icon: Syringe, color: "blue", label: "인슐린" },
  meal: { icon: UtensilsCrossed, color: "orange", label: "식단" },
  exercise: { icon: Dumbbell, color: "green", label: "운동" },
  mood: { icon: Heart, color: "pink", label: "기분" },
};

const bgMap: Record<string, string> = {
  teal: "bg-teal-50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-700",
  blue: "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700",
  orange: "bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-700",
  green: "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700",
  pink: "bg-pink-50 dark:bg-pink-950/30 border-pink-300 dark:border-pink-700",
};

const iconBgMap: Record<string, string> = {
  teal: "bg-teal-500", blue: "bg-blue-500", orange: "bg-orange-500", green: "bg-green-500", pink: "bg-pink-500",
};

function TimelineCard({ item, onToggle, disabled }: { item: TimelineItem; onToggle: () => void; disabled: boolean }) {
  const cfg = typeConfig[item.type];
  const Icon = cfg.icon;

  return (
    <button
      onClick={disabled ? undefined : onToggle}
      className={cn(
        "w-full rounded-xl border-2 px-3 py-2.5 text-left transition-all flex items-center gap-3",
        item.selected ? bgMap[cfg.color] : "bg-muted/30 border-transparent opacity-40",
        disabled && "pointer-events-none"
      )}
    >
      <div className={cn("rounded-full p-1.5 text-white shrink-0", iconBgMap[cfg.color])}>
        <Icon className="size-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-medium text-muted-foreground">{cfg.label}</span>
          {renderContent(item)}
        </div>
      </div>

      <div className={cn(
        "size-5 rounded-full border-2 flex items-center justify-center shrink-0",
        item.selected ? `${iconBgMap[cfg.color]} border-transparent` : "border-muted-foreground/30"
      )}>
        {item.selected && <Check className="size-3 text-white" />}
      </div>
    </button>
  );
}

function renderContent(item: TimelineItem) {
  switch (item.type) {
    case "glucose": {
      const d = item.data as GlucoseItem;
      return (
        <>
          <span className="text-base font-bold">{d.value}</span>
          <span className="text-[11px] text-muted-foreground">mg/dL</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
            {timingLabels[d.timing] || d.timing}
          </span>
          {d.note && <span className="text-[11px] text-muted-foreground">{d.note}</span>}
        </>
      );
    }
    case "insulin": {
      const d = item.data as InsulinItem;
      return (
        <>
          <span className="text-sm font-bold">{d.insulin_name}</span>
          <span className="text-base font-bold">{d.dose}<span className="text-xs">U</span></span>
          <span className="text-[11px] text-muted-foreground">{siteLabels[d.injection_site] || ""}</span>
        </>
      );
    }
    case "meal": {
      const d = item.data as MealItem;
      return (
        <>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
            {mealTypeLabels[d.meal_type] || d.meal_type}
          </span>
          <span className="text-sm font-bold">{d.total_carbs}g</span>
          {d.total_calories && <span className="text-[11px] text-muted-foreground">{d.total_calories}kcal</span>}
          {d.note && <span className="text-[11px] text-muted-foreground">{d.note}</span>}
        </>
      );
    }
    case "exercise": {
      const d = item.data as ExerciseItem;
      return (
        <>
          <span className="text-sm font-bold">{exerciseTypeLabels[d.exercise_type] || d.exercise_type}</span>
          <span className="text-[11px]">{d.duration_minutes}분</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
            {intensityLabels[d.intensity] || d.intensity}
          </span>
        </>
      );
    }
    case "mood": {
      const d = item.data as MoodItem;
      return (
        <>
          <span className="text-sm font-bold">{moodLabels[d.mood] || d.mood}</span>
          <span className="text-[11px] text-muted-foreground">스트레스 {d.stress_level}/5</span>
        </>
      );
    }
  }
}
