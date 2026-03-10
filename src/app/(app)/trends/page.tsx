"use client";

import { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceArea, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Area,
  Legend,
} from "recharts";
import { format, subDays, subHours, isAfter } from "date-fns";
import { ko } from "date-fns/locale/ko";
import { TrendingUp, Activity, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRecordsStore } from "@/stores/records-store";

type Period = "24h" | "7d" | "30d" | "90d";

const periodConfig: Record<Period, { label: string; filter: () => Date }> = {
  "24h": { label: "24시간", filter: () => subHours(new Date(), 24) },
  "7d": { label: "7일", filter: () => subDays(new Date(), 7) },
  "30d": { label: "30일", filter: () => subDays(new Date(), 30) },
  "90d": { label: "90일", filter: () => subDays(new Date(), 90) },
};

const TIR_COLORS = { inRange: "#22c55e", below: "#ef4444", above: "#f97316" };

export default function TrendsPage() {
  const [period, setPeriod] = useState<Period>("7d");
  const { glucoseRecords, insulinRecords, mealRecords, profile } = useRecordsStore();

  const targetMin = profile.target_glucose_min;
  const targetMax = profile.target_glucose_max;

  const filteredGlucose = useMemo(() => {
    const cutoff = periodConfig[period].filter();
    return glucoseRecords
      .filter((r) => isAfter(new Date(r.measured_at), cutoff))
      .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());
  }, [glucoseRecords, period]);

  const glucoseChartData = useMemo(
    () =>
      filteredGlucose.map((r) => ({
        time: format(new Date(r.measured_at), period === "24h" ? "HH:mm" : "M/d HH:mm", { locale: ko }),
        value: r.value,
      })),
    [filteredGlucose, period]
  );

  const tirData = useMemo(() => {
    if (filteredGlucose.length === 0) return [];
    const below = filteredGlucose.filter((r) => r.value < targetMin).length;
    const above = filteredGlucose.filter((r) => r.value > targetMax).length;
    const inRange = filteredGlucose.length - below - above;
    const total = filteredGlucose.length;
    return [
      { name: "범위 내", value: Math.round((inRange / total) * 100), color: TIR_COLORS.inRange },
      { name: "범위 미만", value: Math.round((below / total) * 100), color: TIR_COLORS.below },
      { name: "범위 초과", value: Math.round((above / total) * 100), color: TIR_COLORS.above },
    ];
  }, [filteredGlucose, targetMin, targetMax]);

  const glucoseStats = useMemo(() => {
    if (filteredGlucose.length === 0) return null;
    const values = filteredGlucose.map((r) => r.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const sd = Math.sqrt(values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length);
    return {
      avg: Math.round(avg),
      max,
      min,
      sd: Math.round(sd * 10) / 10,
    };
  }, [filteredGlucose]);

  const insulinChartData = useMemo(() => {
    const cutoff = periodConfig[period].filter();
    const filtered = insulinRecords.filter((r) => isAfter(new Date(r.injected_at), cutoff));
    const grouped: Record<string, { rapid: number; long: number }> = {};
    filtered.forEach((r) => {
      const day = format(new Date(r.injected_at), "M/d");
      if (!grouped[day]) grouped[day] = { rapid: 0, long: 0 };
      if (r.insulin_type === "rapid" || r.insulin_type === "short") {
        grouped[day].rapid += r.dose;
      } else {
        grouped[day].long += r.dose;
      }
    });
    return Object.entries(grouped)
      .map(([day, doses]) => ({ day, ...doses, total: doses.rapid + doses.long }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [insulinRecords, period]);

  const insulinAvg = useMemo(() => {
    if (insulinChartData.length === 0) return 0;
    return Math.round(insulinChartData.reduce((s, d) => s + d.total, 0) / insulinChartData.length * 10) / 10;
  }, [insulinChartData]);

  const compositeData = useMemo(() => {
    const cutoff = periodConfig[period].filter();
    const points: { time: string; timestamp: number; glucose?: number; carbs?: number; insulin?: number }[] = [];

    glucoseRecords
      .filter((r) => isAfter(new Date(r.measured_at), cutoff))
      .forEach((r) => {
        const d = new Date(r.measured_at);
        points.push({ time: format(d, "M/d HH:mm"), timestamp: d.getTime(), glucose: r.value });
      });

    mealRecords
      .filter((r) => isAfter(new Date(r.eaten_at), cutoff))
      .forEach((r) => {
        const d = new Date(r.eaten_at);
        points.push({ time: format(d, "M/d HH:mm"), timestamp: d.getTime(), carbs: r.total_carbs });
      });

    insulinRecords
      .filter((r) => isAfter(new Date(r.injected_at), cutoff))
      .forEach((r) => {
        const d = new Date(r.injected_at);
        points.push({ time: format(d, "M/d HH:mm"), timestamp: d.getTime(), insulin: r.dose });
      });

    return points.sort((a, b) => a.timestamp - b.timestamp);
  }, [glucoseRecords, mealRecords, insulinRecords, period]);

  return (
    <div className="space-y-4 py-6">
      <h1 className="text-2xl font-bold">트렌드 분석</h1>

      <Tabs defaultValue={0}>
        <TabsList className="w-full">
          <TabsTrigger value={0}><Activity className="mr-1 size-4" />혈당</TabsTrigger>
          <TabsTrigger value={1}><BarChart3 className="mr-1 size-4" />인슐린</TabsTrigger>
          <TabsTrigger value={2}><TrendingUp className="mr-1 size-4" />종합</TabsTrigger>
        </TabsList>

        {/* 혈당 Tab */}
        <TabsContent value={0} className="space-y-4 pt-4">
          {/* Period selector */}
          <div className="flex gap-1">
            {(Object.keys(periodConfig) as Period[]).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? "default" : "outline"}
                onClick={() => setPeriod(p)}
                className="flex-1"
              >
                {periodConfig[p].label}
              </Button>
            ))}
          </div>

          {/* Glucose line chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">혈당 추이</CardTitle>
            </CardHeader>
            <CardContent>
              {glucoseChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={glucoseChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis domain={[40, 300]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <ReferenceArea y1={targetMin} y2={targetMax} fill="#22c55e" fillOpacity={0.1} />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="혈당" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">데이터가 없습니다</p>
              )}
            </CardContent>
          </Card>

          {/* TIR donut */}
          {tirData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">목표 범위 내 시간 (TIR)</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center gap-6">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={tirData} dataKey="value" innerRadius={40} outerRadius={60} paddingAngle={2}>
                      {tirData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 text-sm">
                  {tirData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="inline-block size-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span>{d.name}</span>
                      <span className="font-bold">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats cards */}
          {glucoseStats && (
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-xs text-muted-foreground">평균</p>
                  <p className="text-2xl font-bold">{glucoseStats.avg}<span className="text-xs text-muted-foreground ml-1">mg/dL</span></p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-xs text-muted-foreground">최고</p>
                  <p className="text-2xl font-bold text-orange-500">{glucoseStats.max}<span className="text-xs text-muted-foreground ml-1">mg/dL</span></p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-xs text-muted-foreground">최저</p>
                  <p className="text-2xl font-bold text-red-500">{glucoseStats.min}<span className="text-xs text-muted-foreground ml-1">mg/dL</span></p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-xs text-muted-foreground">표준편차</p>
                  <p className="text-2xl font-bold">{glucoseStats.sd}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* 인슐린 Tab */}
        <TabsContent value={1} className="space-y-4 pt-4">
          <div className="flex gap-1">
            {(Object.keys(periodConfig) as Period[]).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? "default" : "outline"}
                onClick={() => setPeriod(p)}
                className="flex-1"
              >
                {periodConfig[p].label}
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">일별 인슐린 투여량</CardTitle>
            </CardHeader>
            <CardContent>
              {insulinChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={insulinChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="rapid" stackId="a" fill="#3b82f6" name="초속효성" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="long" stackId="a" fill="#8b5cf6" name="지속형" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">데이터가 없습니다</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-xs text-muted-foreground">일 평균 투여량</p>
              <p className="text-2xl font-bold">{insulinAvg}<span className="text-xs text-muted-foreground ml-1">단위</span></p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 종합 Tab */}
        <TabsContent value={2} className="space-y-4 pt-4">
          <div className="flex gap-1">
            {(Object.keys(periodConfig) as Period[]).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? "default" : "outline"}
                onClick={() => setPeriod(p)}
                className="flex-1"
              >
                {periodConfig[p].label}
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">혈당 + 탄수화물 + 인슐린</CardTitle>
            </CardHeader>
            <CardContent>
              {compositeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={compositeData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                    <YAxis yAxisId="left" domain={[40, 300]} tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <ReferenceArea yAxisId="left" y1={targetMin} y2={targetMax} fill="#22c55e" fillOpacity={0.08} />
                    <Line yAxisId="left" type="monotone" dataKey="glucose" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} name="혈당" connectNulls />
                    <Bar yAxisId="right" dataKey="carbs" fill="#f59e0b" opacity={0.7} name="탄수화물(g)" />
                    <Area yAxisId="right" type="monotone" dataKey="insulin" fill="#8b5cf6" fillOpacity={0.3} stroke="#8b5cf6" name="인슐린(U)" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">데이터가 없습니다</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">패턴 인사이트</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                <span className="mt-0.5 text-amber-500">&#9679;</span>
                <p>식후 2시간 혈당이 높은 경향이 있어요. 식전 인슐린 타이밍을 10-15분 앞당겨 보세요.</p>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
                <span className="mt-0.5 text-blue-500">&#9679;</span>
                <p>새벽 시간대(04-06시) 혈당이 상승하는 새벽현상이 관찰됩니다.</p>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
                <span className="mt-0.5 text-green-500">&#9679;</span>
                <p>운동 후 혈당이 잘 조절되고 있어요. 꾸준히 유지하세요!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
