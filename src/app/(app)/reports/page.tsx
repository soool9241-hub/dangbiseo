"use client";

import { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea,
} from "recharts";
import { format, subDays, startOfMonth, isAfter } from "date-fns";
import { ko } from "date-fns/locale/ko";
import {
  FileText, Share2, Droplet, Target, Syringe, UtensilsCrossed, Dumbbell, SmilePlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRecordsStore } from "@/stores/records-store";

type ReportPeriod = "7d" | "30d" | "month";

const periodOptions: { value: ReportPeriod; label: string }[] = [
  { value: "7d", label: "최근 7일" },
  { value: "30d", label: "최근 30일" },
  { value: "month", label: "이번 달" },
];

const moodLabels: Record<string, number> = {
  great: 5, good: 4, neutral: 3, bad: 2, terrible: 1,
};

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("7d");
  const { glucoseRecords, insulinRecords, mealRecords, exerciseRecords, moodRecords, profile } = useRecordsStore();

  const cutoff = useMemo(() => {
    switch (period) {
      case "7d": return subDays(new Date(), 7);
      case "30d": return subDays(new Date(), 30);
      case "month": return startOfMonth(new Date());
    }
  }, [period]);

  const filteredGlucose = useMemo(
    () => glucoseRecords.filter((r) => isAfter(new Date(r.measured_at), cutoff)),
    [glucoseRecords, cutoff]
  );

  const filteredInsulin = useMemo(
    () => insulinRecords.filter((r) => isAfter(new Date(r.injected_at), cutoff)),
    [insulinRecords, cutoff]
  );

  const filteredMeals = useMemo(
    () => mealRecords.filter((r) => isAfter(new Date(r.eaten_at), cutoff)),
    [mealRecords, cutoff]
  );

  const filteredExercise = useMemo(
    () => exerciseRecords.filter((r) => isAfter(new Date(r.started_at), cutoff)),
    [exerciseRecords, cutoff]
  );

  const filteredMoods = useMemo(
    () => moodRecords.filter((r) => isAfter(new Date(r.recorded_at), cutoff)),
    [moodRecords, cutoff]
  );

  const avgGlucose = useMemo(() => {
    if (filteredGlucose.length === 0) return 0;
    return Math.round(filteredGlucose.reduce((s, r) => s + r.value, 0) / filteredGlucose.length);
  }, [filteredGlucose]);

  const tir = useMemo(() => {
    if (filteredGlucose.length === 0) return 0;
    const inRange = filteredGlucose.filter(
      (r) => r.value >= profile.target_glucose_min && r.value <= profile.target_glucose_max
    ).length;
    return Math.round((inRange / filteredGlucose.length) * 100);
  }, [filteredGlucose, profile]);

  const totalInsulin = useMemo(
    () => Math.round(filteredInsulin.reduce((s, r) => s + r.dose, 0) * 10) / 10,
    [filteredInsulin]
  );

  const totalCarbs = useMemo(
    () => Math.round(filteredMeals.reduce((s, r) => s + r.total_carbs, 0)),
    [filteredMeals]
  );

  const exerciseCount = filteredExercise.length;

  const avgMood = useMemo(() => {
    if (filteredMoods.length === 0) return "-";
    const sum = filteredMoods.reduce((s, r) => s + (moodLabels[r.mood] || 3), 0);
    const avg = sum / filteredMoods.length;
    if (avg >= 4.5) return "😄";
    if (avg >= 3.5) return "🙂";
    if (avg >= 2.5) return "😐";
    if (avg >= 1.5) return "😟";
    return "😢";
  }, [filteredMoods]);

  const chartData = useMemo(
    () =>
      filteredGlucose
        .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
        .map((r) => ({
          time: format(new Date(r.measured_at), "M/d HH:mm", { locale: ko }),
          value: r.value,
        })),
    [filteredGlucose]
  );

  const handleExportPDF = () => {
    alert("PDF 내보내기 기능은 준비 중입니다");
  };

  const handleShare = () => {
    alert("의료진 공유 기능은 준비 중입니다");
  };

  return (
    <div className="space-y-4 py-6">
      <h1 className="text-2xl font-bold">리포트</h1>

      {/* Period selector */}
      <div className="flex gap-1">
        {periodOptions.map((opt) => (
          <Button
            key={opt.value}
            size="sm"
            variant={period === opt.value ? "default" : "outline"}
            onClick={() => setPeriod(opt.value)}
            className="flex-1"
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <Droplet className="size-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">평균 혈당</p>
              <p className="text-xl font-bold">{avgGlucose || "-"}<span className="text-xs text-muted-foreground ml-0.5">mg/dL</span></p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <Target className="size-5 text-green-500 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">TIR</p>
              <p className="text-xl font-bold">{tir || "-"}<span className="text-xs text-muted-foreground ml-0.5">%</span></p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <Syringe className="size-5 text-purple-500 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">총 인슐린</p>
              <p className="text-xl font-bold">{totalInsulin || "-"}<span className="text-xs text-muted-foreground ml-0.5">U</span></p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <UtensilsCrossed className="size-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">총 탄수화물</p>
              <p className="text-xl font-bold">{totalCarbs || "-"}<span className="text-xs text-muted-foreground ml-0.5">g</span></p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <Dumbbell className="size-5 text-green-500 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">운동 횟수</p>
              <p className="text-xl font-bold">{exerciseCount}<span className="text-xs text-muted-foreground ml-0.5">회</span></p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <SmilePlus className="size-5 text-pink-500 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">평균 기분</p>
              <p className="text-xl font-bold">{avgMood}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart preview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">혈당 추이</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis domain={[40, 300]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <ReferenceArea
                  y1={profile.target_glucose_min}
                  y2={profile.target_glucose_max}
                  fill="#22c55e"
                  fillOpacity={0.1}
                />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} name="혈당" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">데이터가 없습니다</p>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button onClick={handleExportPDF} className="flex-1 gap-2" variant="outline">
          <FileText className="size-4" />
          PDF로 내보내기
        </Button>
        <Button onClick={handleShare} className="flex-1 gap-2" variant="outline">
          <Share2 className="size-4" />
          의료진 공유
        </Button>
      </div>
    </div>
  );
}
