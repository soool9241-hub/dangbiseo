"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { TodaySummary } from "@/components/dashboard/TodaySummary";
import { useRecordsStore } from "@/stores/records-store";
import { useMemo } from "react";
import { isToday } from "date-fns";

const DailyGlucoseChart = dynamic(
  () => import("@/components/dashboard/DailyGlucoseChart").then((m) => ({ default: m.DailyGlucoseChart })),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" /> }
);

export default function DashboardPage() {
  const { theme, setTheme } = useTheme();
  const { glucoseRecords, profile } = useRecordsStore();
  const todayStr = format(new Date(), "M월 d일 (EEEE)", { locale: ko });

  const tir = useMemo(() => {
    const todayGlucose = glucoseRecords.filter((r) => isToday(new Date(r.measured_at)));
    if (todayGlucose.length === 0) return null;
    const inRange = todayGlucose.filter(
      (r) => r.value >= profile.target_glucose_min && r.value <= profile.target_glucose_max
    );
    return Math.round((inRange.length / todayGlucose.length) * 100);
  }, [glucoseRecords, profile.target_glucose_min, profile.target_glucose_max]);

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
    </div>
  );
}
