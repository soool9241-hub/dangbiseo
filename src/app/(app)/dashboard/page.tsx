"use client";

import { useMemo, useState } from "react";
import { isToday, isYesterday, format, startOfDay, endOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Sun, Moon, Droplets, Syringe, UtensilsCrossed, Dumbbell, SmilePlus,
  ChevronRight, ImageIcon, Clock,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRecordsStore } from "@/stores/records-store";
import { TodaySummary } from "@/components/dashboard/TodaySummary";
import { DailyGlucoseChart } from "@/components/dashboard/DailyGlucoseChart";

const mealTypeLabels: Record<string, string> = {
  breakfast: "아침", lunch: "점심", dinner: "저녁", snack: "간식",
};

const timingLabels: Record<string, string> = {
  fasting: "공복", before_meal: "식전", after_meal: "식후",
  before_exercise: "운동전", after_exercise: "운동후",
  before_sleep: "취침전", other: "상시",
};

const moodEmojis: Record<string, string> = {
  great: "😄", good: "😊", neutral: "😐", bad: "😔", terrible: "😢",
};

const moodLabels: Record<string, string> = {
  great: "최고", good: "좋음", neutral: "보통", bad: "나쁨", terrible: "최악",
};

const exerciseLabels: Record<string, string> = {
  weight: "웨이트", cardio: "유산소", swimming: "수영", dance: "댄스",
  martial_arts: "격투기", yoga: "요가", walking: "걷기", cycling: "자전거", other: "기타",
};

const intensityLabels: Record<string, string> = {
  low: "가벼움", moderate: "보통", high: "격렬",
};

function getGlucoseColor(value: number, min: number, max: number) {
  if (value < min) return "text-red-600 dark:text-red-400";
  if (value > max) return "text-orange-600 dark:text-orange-400";
  return "text-green-600 dark:text-green-400";
}

function formatRecordTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return `어제 ${format(d, "HH:mm")}`;
  return format(d, "M/d HH:mm");
}

export default function DashboardPage() {
  const { theme, setTheme } = useTheme();
  const {
    glucoseRecords,
    insulinRecords,
    mealRecords,
    exerciseRecords,
    moodRecords,
    profile,
  } = useRecordsStore();

  const todayStr = format(new Date(), "M월 d일 (EEEE)", { locale: ko });

  // Today's glucose records
  const todayGlucose = useMemo(
    () => glucoseRecords.filter((r) => isToday(new Date(r.measured_at))),
    [glucoseRecords]
  );

  // Calculate TIR
  const tir = useMemo(() => {
    if (todayGlucose.length === 0) return null;
    const inRange = todayGlucose.filter(
      (r) => r.value >= profile.target_glucose_min && r.value <= profile.target_glucose_max
    );
    return Math.round((inRange.length / todayGlucose.length) * 100);
  }, [todayGlucose, profile.target_glucose_min, profile.target_glucose_max]);

  // Today's insulin
  const todayInsulin = useMemo(
    () => insulinRecords.filter((r) => isToday(new Date(r.injected_at))),
    [insulinRecords]
  );

  // Today's meals
  const todayMeals = useMemo(
    () => mealRecords.filter((r) => isToday(new Date(r.eaten_at))),
    [mealRecords]
  );

  // Today's exercise
  const todayExercise = useMemo(
    () => exerciseRecords.filter((r) => isToday(new Date(r.started_at))),
    [exerciseRecords]
  );

  // Today's mood
  const todayMoods = useMemo(
    () => moodRecords.filter((r) => isToday(new Date(r.recorded_at)))
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()),
    [moodRecords]
  );

  return (
    <div className="flex flex-col gap-5 px-4 pb-24 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">오늘의 당비서</h1>
          <p className="text-sm text-muted-foreground">{todayStr}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="테마 변경"
        >
          <Sun className="size-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </Button>
      </div>

      {/* Today Summary Cards */}
      <TodaySummary />

      {/* Glucose Chart */}
      <DailyGlucoseChart />

      {/* TIR Message */}
      <div className="rounded-xl bg-teal-50 px-4 py-3 text-center dark:bg-teal-950/30">
        {tir !== null ? (
          <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
            오늘 TIR {tir}%! {tir >= 70 ? "잘 하고 있어요 👍" : tir >= 50 ? "조금 더 힘내봐요 💪" : "목표를 확인해보세요 📋"}
          </p>
        ) : (
          <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
            첫 기록을 시작해보세요!
          </p>
        )}
      </div>

      {/* ── 혈당 기록 상세 ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Droplets className="size-4 text-blue-500" />
              오늘 혈당 기록
            </CardTitle>
            <Link href="/record/glucose" className="text-xs text-blue-500 flex items-center gap-0.5">
              기록하기 <ChevronRight className="size-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {todayGlucose.length > 0 ? (
            <div className="space-y-2">
              {todayGlucose
                .sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime())
                .slice(0, 10)
                .map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-muted-foreground w-12">
                        {format(new Date(r.measured_at), "HH:mm")}
                      </span>
                      <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {timingLabels[r.timing] || "상시"}
                      </Badge>
                    </div>
                    <span className={cn("text-sm font-bold tabular-nums", getGlucoseColor(r.value, profile.target_glucose_min, profile.target_glucose_max))}>
                      {r.value} <span className="text-xs font-normal text-muted-foreground">{profile.glucose_unit}</span>
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">오늘 혈당 기록이 없습니다</p>
          )}
        </CardContent>
      </Card>

      {/* ── 인슐린 기록 상세 ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Syringe className="size-4 text-purple-500" />
              오늘 인슐린 기록
            </CardTitle>
            <Link href="/record/insulin" className="text-xs text-purple-500 flex items-center gap-0.5">
              기록하기 <ChevronRight className="size-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {todayInsulin.length > 0 ? (
            <div className="space-y-2">
              {todayInsulin
                .sort((a, b) => new Date(b.injected_at).getTime() - new Date(a.injected_at).getTime())
                .map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-muted-foreground w-12">
                        {format(new Date(r.injected_at), "HH:mm")}
                      </span>
                      <span className="text-sm font-medium">{r.insulin_name}</span>
                      <Badge variant="secondary" className={cn("text-[10px]",
                        r.insulin_type === "rapid"
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                      )}>
                        {r.insulin_type === "rapid" ? "속효성" : "지속성"}
                      </Badge>
                    </div>
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                      {r.dose}U
                    </span>
                  </div>
                ))}
              <div className="pt-2 border-t flex justify-between text-xs text-muted-foreground">
                <span>합계</span>
                <span className="font-semibold text-foreground">
                  속효 {todayInsulin.filter(r => r.insulin_type === "rapid").reduce((s, r) => s + r.dose, 0)}U
                  {" · "}
                  지속 {todayInsulin.filter(r => r.insulin_type !== "rapid").reduce((s, r) => s + r.dose, 0)}U
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">오늘 인슐린 기록이 없습니다</p>
          )}
        </CardContent>
      </Card>

      {/* ── 식단 기록 상세 ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <UtensilsCrossed className="size-4 text-orange-500" />
              오늘 식단 기록
            </CardTitle>
            <Link href="/record/meal" className="text-xs text-orange-500 flex items-center gap-0.5">
              기록하기 <ChevronRight className="size-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {todayMeals.length > 0 ? (
            <div className="space-y-2">
              {todayMeals
                .sort((a, b) => new Date(b.eaten_at).getTime() - new Date(a.eaten_at).getTime())
                .map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs text-muted-foreground w-12 shrink-0">
                        {format(new Date(r.eaten_at), "HH:mm")}
                      </span>
                      <Badge variant="secondary" className="text-[10px] bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 shrink-0">
                        {mealTypeLabels[r.meal_type] || r.meal_type}
                      </Badge>
                      {r.note && (
                        <span className="text-xs text-muted-foreground truncate">
                          {r.note.replace("[AI 텍스트 인식]", "").replace("[AI]", "").trim().split("\n")[0].slice(0, 30)}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                        {r.total_carbs}g
                      </span>
                      {r.total_calories != null && r.total_calories > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">{r.total_calories}kcal</span>
                      )}
                    </div>
                  </div>
                ))}
              <div className="pt-2 border-t flex justify-between text-xs text-muted-foreground">
                <span>{todayMeals.length}끼</span>
                <span className="font-semibold text-foreground">
                  총 {todayMeals.reduce((s, r) => s + r.total_carbs, 0)}g 탄수화물
                  {todayMeals.some(r => r.total_calories) && (
                    <> · {todayMeals.reduce((s, r) => s + (r.total_calories || 0), 0)}kcal</>
                  )}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">오늘 식단 기록이 없습니다</p>
          )}
        </CardContent>
      </Card>

      {/* ── 운동 기록 상세 ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Dumbbell className="size-4 text-green-500" />
              오늘 운동 기록
            </CardTitle>
            <Link href="/record/exercise" className="text-xs text-green-500 flex items-center gap-0.5">
              기록하기 <ChevronRight className="size-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {todayExercise.length > 0 ? (
            <div className="space-y-2">
              {todayExercise
                .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
                .map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-muted-foreground w-12">
                        {format(new Date(r.started_at), "HH:mm")}
                      </span>
                      <span className="text-sm font-medium">
                        {exerciseLabels[r.exercise_type] || r.exercise_type}
                      </span>
                      <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {intensityLabels[r.intensity] || r.intensity}
                      </Badge>
                    </div>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400 tabular-nums">
                      {r.duration_minutes}분
                    </span>
                  </div>
                ))}
              <div className="pt-2 border-t flex justify-between text-xs text-muted-foreground">
                <span>합계</span>
                <span className="font-semibold text-foreground">
                  총 {todayExercise.reduce((s, r) => s + r.duration_minutes, 0)}분
                  {todayExercise.some(r => r.calories_burned) && (
                    <> · {todayExercise.reduce((s, r) => s + (r.calories_burned || 0), 0)}kcal 소모</>
                  )}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">오늘 운동 기록이 없습니다</p>
          )}
        </CardContent>
      </Card>

      {/* ── 기분 기록 상세 ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <SmilePlus className="size-4 text-pink-500" />
              오늘 기분 기록
            </CardTitle>
            <Link href="/record/mood" className="text-xs text-pink-500 flex items-center gap-0.5">
              기록하기 <ChevronRight className="size-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {todayMoods.length > 0 ? (
            <div className="space-y-2">
              {todayMoods.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-muted-foreground w-12">
                      {format(new Date(r.recorded_at), "HH:mm")}
                    </span>
                    <span className="text-lg">{moodEmojis[r.mood] || "😐"}</span>
                    <span className="text-sm font-medium">{moodLabels[r.mood] || r.mood}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    스트레스 {r.stress_level}/10
                  </span>
                </div>
              ))}
              {todayMoods[0]?.note && (
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  {todayMoods[0].note.replace("[AI 텍스트 인식]", "").trim()}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">오늘 기분 기록이 없습니다</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Records (all types) */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-muted-foreground" />
              최근 기록
            </CardTitle>
            <Link href="/history" className="text-xs text-muted-foreground flex items-center gap-0.5">
              전체 보기 <ChevronRight className="size-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <RecentRecordsList />
        </CardContent>
      </Card>
    </div>
  );
}

function RecentRecordsList() {
  const { glucoseRecords, insulinRecords, mealRecords, exerciseRecords, moodRecords, profile } = useRecordsStore();

  type RecentItem = { id: string; type: string; label: string; detail: string; time: Date };

  const records = useMemo(() => {
    const all: RecentItem[] = [];

    glucoseRecords.slice(0, 5).forEach((r) => {
      all.push({
        id: r.id, type: "glucose",
        label: `${r.value} ${profile.glucose_unit}`,
        detail: timingLabels[r.timing] || "상시",
        time: new Date(r.measured_at),
      });
    });

    insulinRecords.slice(0, 5).forEach((r) => {
      all.push({
        id: r.id, type: "insulin",
        label: `${r.insulin_name} ${r.dose}U`,
        detail: r.insulin_type === "rapid" ? "속효성" : "지속성",
        time: new Date(r.injected_at),
      });
    });

    mealRecords.slice(0, 5).forEach((r) => {
      all.push({
        id: r.id, type: "meal",
        label: `${mealTypeLabels[r.meal_type] || r.meal_type}`,
        detail: `${r.total_carbs}g`,
        time: new Date(r.eaten_at),
      });
    });

    exerciseRecords.slice(0, 5).forEach((r) => {
      all.push({
        id: r.id, type: "exercise",
        label: exerciseLabels[r.exercise_type] || r.exercise_type,
        detail: `${r.duration_minutes}분`,
        time: new Date(r.started_at),
      });
    });

    moodRecords.slice(0, 5).forEach((r) => {
      all.push({
        id: r.id, type: "mood",
        label: `${moodEmojis[r.mood] || "😐"} ${moodLabels[r.mood] || r.mood}`,
        detail: `스트레스 ${r.stress_level}/10`,
        time: new Date(r.recorded_at),
      });
    });

    return all.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 8);
  }, [glucoseRecords, insulinRecords, mealRecords, exerciseRecords, moodRecords, profile.glucose_unit]);

  const badgeColors: Record<string, string> = {
    glucose: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    insulin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    meal: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    exercise: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    mood: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  };

  const typeNames: Record<string, string> = {
    glucose: "혈당", insulin: "인슐린", meal: "식사", exercise: "운동", mood: "기분",
  };

  if (records.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">기록이 없습니다</p>;
  }

  return (
    <div className="space-y-2">
      {records.map((r) => (
        <div key={r.id} className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="secondary" className={cn("text-[10px] shrink-0", badgeColors[r.type])}>
              {typeNames[r.type]}
            </Badge>
            <span className="text-sm font-medium truncate">{r.label}</span>
            <span className="text-xs text-muted-foreground truncate">{r.detail}</span>
          </div>
          <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
            {formatRecordTime(r.time.toISOString())}
          </span>
        </div>
      ))}
    </div>
  );
}
