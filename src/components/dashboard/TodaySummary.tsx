"use client";

import { useMemo } from "react";
import { isToday } from "date-fns";
import { Droplets, Syringe, Wheat, SmilePlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRecordsStore } from "@/stores/records-store";
import type { MoodLevel } from "@/types/database";

const moodEmojis: Record<MoodLevel, string> = {
  great: "😄",
  good: "😊",
  neutral: "😐",
  bad: "😔",
  terrible: "😢",
};

const moodLabels: Record<MoodLevel, string> = {
  great: "아주 좋음",
  good: "좋음",
  neutral: "보통",
  bad: "나쁨",
  terrible: "매우 나쁨",
};

function getGlucoseColor(value: number, min: number, max: number) {
  if (value < min) return "text-red-600 dark:text-red-400";
  if (value > max) return "text-orange-600 dark:text-orange-400";
  return "text-green-600 dark:text-green-400";
}

export function TodaySummary() {
  const { glucoseRecords, insulinRecords, mealRecords, moodRecords, profile } =
    useRecordsStore();

  const todayGlucose = useMemo(
    () => glucoseRecords.filter((r) => isToday(new Date(r.measured_at))),
    [glucoseRecords]
  );

  const todayInsulin = useMemo(
    () => insulinRecords.filter((r) => isToday(new Date(r.injected_at))),
    [insulinRecords]
  );

  const todayMeals = useMemo(
    () => mealRecords.filter((r) => isToday(new Date(r.eaten_at))),
    [mealRecords]
  );

  const todayMoods = useMemo(
    () =>
      moodRecords
        .filter((r) => isToday(new Date(r.recorded_at)))
        .sort(
          (a, b) =>
            new Date(b.recorded_at).getTime() -
            new Date(a.recorded_at).getTime()
        ),
    [moodRecords]
  );

  const latestGlucose = todayGlucose[0] ?? null;
  const totalDose = todayInsulin.reduce((sum, r) => sum + r.dose, 0);
  const rapidDose = todayInsulin
    .filter((r) => r.insulin_type === "rapid")
    .reduce((sum, r) => sum + r.dose, 0);
  const longDose = todayInsulin
    .filter((r) => r.insulin_type === "long")
    .reduce((sum, r) => sum + r.dose, 0);
  const totalCarbs = todayMeals.reduce((sum, r) => sum + r.total_carbs, 0);
  const latestMood = todayMoods[0] ?? null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Glucose Card */}
      <Card size="sm">
        <CardContent className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Droplets className="size-4 text-teal-500" />
            <span className="text-xs font-medium">혈당</span>
          </div>
          {latestGlucose ? (
            <>
              <span
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  getGlucoseColor(
                    latestGlucose.value,
                    profile.target_glucose_min,
                    profile.target_glucose_max
                  )
                )}
              >
                {latestGlucose.value}
                <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                  {profile.glucose_unit}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                오늘 {todayGlucose.length}회 측정
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">기록 없음</span>
          )}
        </CardContent>
      </Card>

      {/* Insulin Card */}
      <Card size="sm">
        <CardContent className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Syringe className="size-4 text-teal-500" />
            <span className="text-xs font-medium">인슐린</span>
          </div>
          {totalDose > 0 ? (
            <>
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {totalDose}
                <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                  units
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                초속효 {rapidDose}u · 지속 {longDose}u
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">기록 없음</span>
          )}
        </CardContent>
      </Card>

      {/* Carbs Card */}
      <Card size="sm">
        <CardContent className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Wheat className="size-4 text-teal-500" />
            <span className="text-xs font-medium">탄수화물</span>
          </div>
          {totalCarbs > 0 ? (
            <>
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {totalCarbs}
                <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                  g
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                {todayMeals.length}끼 기록
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">기록 없음</span>
          )}
        </CardContent>
      </Card>

      {/* Mood Card */}
      <Card size="sm">
        <CardContent className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <SmilePlus className="size-4 text-teal-500" />
            <span className="text-xs font-medium">기분</span>
          </div>
          {latestMood ? (
            <>
              <span className="text-2xl">{moodEmojis[latestMood.mood]}</span>
              <span className="text-xs text-muted-foreground">
                {moodLabels[latestMood.mood]}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">기록 없음</span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
