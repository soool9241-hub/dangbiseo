"use client";

import { useMemo } from "react";
import { isToday, format } from "date-fns";
import { ko } from "date-fns/locale";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRecordsStore } from "@/stores/records-store";
import { TodaySummary } from "@/components/dashboard/TodaySummary";
import { DailyGlucoseChart } from "@/components/dashboard/DailyGlucoseChart";

type RecentRecord = {
  id: string;
  type: "glucose" | "insulin" | "meal" | "exercise" | "mood";
  label: string;
  detail: string;
  time: Date;
};

const typeLabels: Record<RecentRecord["type"], string> = {
  glucose: "혈당",
  insulin: "인슐린",
  meal: "식사",
  exercise: "운동",
  mood: "기분",
};

const typeBadgeColors: Record<RecentRecord["type"], string> = {
  glucose: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  insulin:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  meal: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  exercise:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  mood: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
};

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

  // Calculate TIR (Time in Range) for today
  const tir = useMemo(() => {
    const todayGlucose = glucoseRecords.filter((r) =>
      isToday(new Date(r.measured_at))
    );
    if (todayGlucose.length === 0) return null;
    const inRange = todayGlucose.filter(
      (r) =>
        r.value >= profile.target_glucose_min &&
        r.value <= profile.target_glucose_max
    );
    return Math.round((inRange.length / todayGlucose.length) * 100);
  }, [glucoseRecords, profile.target_glucose_min, profile.target_glucose_max]);

  // Recent records across all types
  const recentRecords = useMemo(() => {
    const all: RecentRecord[] = [];

    glucoseRecords.slice(0, 10).forEach((r) => {
      all.push({
        id: r.id,
        type: "glucose",
        label: `${r.value} ${profile.glucose_unit}`,
        detail:
          r.timing === "fasting"
            ? "공복"
            : r.timing === "before_meal"
              ? "식전"
              : r.timing === "after_meal"
                ? "식후"
                : r.timing === "before_sleep"
                  ? "취침 전"
                  : r.timing === "before_exercise"
                    ? "운동 전"
                    : "운동 후",
        time: new Date(r.measured_at),
      });
    });

    insulinRecords.slice(0, 10).forEach((r) => {
      all.push({
        id: r.id,
        type: "insulin",
        label: `${r.insulin_name} ${r.dose}u`,
        detail: r.insulin_type === "rapid" ? "초속효" : "지속형",
        time: new Date(r.injected_at),
      });
    });

    mealRecords.slice(0, 10).forEach((r) => {
      const mealLabels: Record<string, string> = {
        breakfast: "아침",
        lunch: "점심",
        dinner: "저녁",
        snack: "간식",
      };
      all.push({
        id: r.id,
        type: "meal",
        label: `${mealLabels[r.meal_type] ?? r.meal_type}`,
        detail: `${r.total_carbs}g 탄수화물`,
        time: new Date(r.eaten_at),
      });
    });

    exerciseRecords.slice(0, 10).forEach((r) => {
      all.push({
        id: r.id,
        type: "exercise",
        label: r.exercise_type,
        detail: `${r.duration_minutes}분`,
        time: new Date(r.started_at),
      });
    });

    moodRecords.slice(0, 10).forEach((r) => {
      const moodEmojis: Record<string, string> = {
        great: "😄",
        good: "😊",
        neutral: "😐",
        bad: "😔",
        terrible: "😢",
      };
      all.push({
        id: r.id,
        type: "mood",
        label: moodEmojis[r.mood] ?? "😐",
        detail: `스트레스 ${r.stress_level}/10`,
        time: new Date(r.recorded_at),
      });
    });

    return all
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 5);
  }, [
    glucoseRecords,
    insulinRecords,
    mealRecords,
    exerciseRecords,
    moodRecords,
    profile.glucose_unit,
  ]);

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

      {/* Today Summary */}
      <TodaySummary />

      {/* Glucose Chart */}
      <DailyGlucoseChart />

      {/* Encouraging Message */}
      <div className="rounded-xl bg-teal-50 px-4 py-3 text-center dark:bg-teal-950/30">
        {tir !== null ? (
          <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
            오늘 TIR {tir}%! 잘 하고 있어요 👍
          </p>
        ) : (
          <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
            첫 기록을 시작해보세요!
          </p>
        )}
      </div>

      {/* Recent Records */}
      {recentRecords.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-foreground">
              최근 기록
            </h2>
            <ul className="flex flex-col gap-2">
              {recentRecords.map((record) => (
                <li
                  key={record.id}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "shrink-0 text-[10px]",
                        typeBadgeColors[record.type]
                      )}
                    >
                      {typeLabels[record.type]}
                    </Badge>
                    <span className="truncate text-sm font-medium text-foreground">
                      {record.label}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {record.detail}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {format(record.time, "M/d HH:mm")}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
