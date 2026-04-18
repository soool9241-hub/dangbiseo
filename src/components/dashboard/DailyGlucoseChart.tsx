"use client";

import { useMemo, useState } from "react";
import { format, subDays, subHours, startOfDay, endOfDay, isAfter, differenceInHours } from "date-fns";
import { ko } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  CartesianGrid,
  Dot,
} from "recharts";
import { Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { useRecordsStore } from "@/stores/records-store";
import { cn } from "@/lib/utils";

type Period = "1d" | "3d" | "7d" | "30d";

const PERIODS: { value: Period; label: string }[] = [
  { value: "1d", label: "하루" },
  { value: "3d", label: "3일" },
  { value: "7d", label: "7일" },
  { value: "30d", label: "30일" },
];

interface ChartDataPoint {
  time: string;
  fullTime: string;
  value: number;
  timestamp: number;
  minuteOfDay?: number;
}

// For 1-day view: 24h X-axis
const HOUR_TICKS_1D = [0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => h * 60);

function GlucoseDot(props: {
  cx?: number;
  cy?: number;
  payload?: ChartDataPoint;
  targetMin: number;
  targetMax: number;
  dotSize: number;
}) {
  const { cx, cy, payload, targetMin, targetMax, dotSize } = props;
  if (cx == null || cy == null || !payload) return null;

  let fill = "#22c55e";
  if (payload.value < targetMin) fill = "#ef4444";
  else if (payload.value > targetMax) fill = "#f97316";

  return <Dot cx={cx} cy={cy} r={dotSize} fill={fill} stroke="white" strokeWidth={1.5} />;
}

export function DailyGlucoseChart() {
  const { glucoseRecords, profile } = useRecordsStore();
  const targetMin = profile.target_glucose_min;
  const targetMax = profile.target_glucose_max;
  const [period, setPeriod] = useState<Period>("1d");

  // Filter records by period
  const chartData = useMemo(() => {
    const now = new Date();

    if (period === "1d") {
      // Today only, X-axis = minuteOfDay (0-1440)
      const dayStart = startOfDay(now);
      const dayEnd = endOfDay(now);
      return glucoseRecords
        .filter((r) => {
          const d = new Date(r.measured_at);
          return d >= dayStart && d <= dayEnd;
        })
        .map((r) => {
          const d = new Date(r.measured_at);
          return {
            time: format(d, "HH:mm"),
            fullTime: format(d, "M/d HH:mm"),
            value: r.value,
            timestamp: d.getTime(),
            minuteOfDay: d.getHours() * 60 + d.getMinutes(),
          };
        })
        .sort((a, b) => a.timestamp - b.timestamp);
    }

    // Multi-day view: X-axis = timestamp
    const days = period === "3d" ? 3 : period === "7d" ? 7 : 30;
    const cutoff = subDays(now, days);

    return glucoseRecords
      .filter((r) => isAfter(new Date(r.measured_at), cutoff))
      .map((r) => {
        const d = new Date(r.measured_at);
        const timeFormat = days <= 7 ? "M/d HH:mm" : "M/d";
        return {
          time: format(d, timeFormat, { locale: ko }),
          fullTime: format(d, "M월 d일 HH:mm", { locale: ko }),
          value: r.value,
          timestamp: d.getTime(),
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [glucoseRecords, period]);

  // Stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const values = chartData.map((d) => d.value);
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const inRange = values.filter((v) => v >= targetMin && v <= targetMax).length;
    const tir = Math.round((inRange / values.length) * 100);
    return { avg, min, max, tir, count: values.length };
  }, [chartData, targetMin, targetMax]);

  // Current time marker for 1d view
  const nowMinute = useMemo(() => {
    if (period !== "1d") return null;
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, [period]);

  // Period label
  const periodLabel = useMemo(() => {
    const now = new Date();
    if (period === "1d") return `오늘 (${format(now, "M/d")})`;
    const days = period === "3d" ? 3 : period === "7d" ? 7 : 30;
    const from = subDays(now, days);
    return `${format(from, "M/d")} ~ ${format(now, "M/d")}`;
  }, [period]);

  // Determine dot size based on data points
  const dotSize = chartData.length > 50 ? 3 : chartData.length > 20 ? 4 : 5;

  // X-axis ticks for multi-day views
  const multiDayTicks = useMemo(() => {
    if (period === "1d") return [];
    const days = period === "3d" ? 3 : period === "7d" ? 7 : 30;
    const now = new Date();
    const ticks: number[] = [];
    // Add one tick per day at noon
    for (let i = days; i >= 0; i--) {
      const d = startOfDay(subDays(now, i));
      d.setHours(12, 0, 0, 0);
      ticks.push(d.getTime());
    }
    return ticks;
  }, [period]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-4 text-teal-500" />
            혈당 그래프
          </CardTitle>
          <span className="text-xs text-muted-foreground">{periodLabel}</span>
        </div>
        {/* Period selector */}
        <div className="flex gap-1 pt-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors",
                period === p.value
                  ? "bg-teal-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="혈당 기록이 없습니다"
            description={period === "1d" ? "오늘의 첫 혈당을 기록해보세요." : "해당 기간에 기록이 없습니다."}
            className="py-8"
          />
        ) : (
          <>
            {/* Stats bar */}
            {stats && (
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex gap-3 text-xs">
                  <span className="text-muted-foreground">
                    평균 <span className="font-semibold text-foreground">{stats.avg}</span>
                  </span>
                  <span className="text-muted-foreground">
                    최저 <span className="font-semibold text-red-500">{stats.min}</span>
                  </span>
                  <span className="text-muted-foreground">
                    최고 <span className="font-semibold text-orange-500">{stats.max}</span>
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">TIR </span>
                  <span className={cn("font-bold", stats.tir >= 70 ? "text-green-600" : stats.tir >= 50 ? "text-orange-500" : "text-red-500")}>
                    {stats.tir}%
                  </span>
                  <span className="text-muted-foreground ml-1">({stats.count}회)</span>
                </div>
              </div>
            )}

            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 8, bottom: 4, left: -16 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />

                {/* Target range */}
                <ReferenceArea
                  y1={targetMin}
                  y2={targetMax}
                  fill="#14b8a6"
                  fillOpacity={0.08}
                  strokeOpacity={0}
                />

                {/* Target lines */}
                <ReferenceLine y={targetMin} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={targetMax} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1} />

                {/* Current time indicator (1d only) */}
                {nowMinute !== null && period === "1d" && (
                  <ReferenceLine
                    x={nowMinute}
                    stroke="#14b8a6"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{ value: "지금", position: "top", fontSize: 10, fill: "#14b8a6" }}
                  />
                )}

                {/* X-Axis: different for 1d vs multi-day */}
                {period === "1d" ? (
                  <XAxis
                    dataKey="minuteOfDay"
                    type="number"
                    domain={[0, 1440]}
                    ticks={HOUR_TICKS_1D}
                    tickFormatter={(v: number) => {
                      const h = Math.floor(v / 60);
                      return `${h}시`;
                    }}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                ) : (
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    ticks={multiDayTicks}
                    tickFormatter={(v: number) => format(new Date(v), "M/d")}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                )}

                <YAxis
                  domain={[
                    (dataMin: number) => Math.min(dataMin - 15, targetMin - 15),
                    (dataMax: number) => Math.max(dataMax + 15, targetMax + 15),
                  ]}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  className="text-muted-foreground"
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload as ChartDataPoint;
                    const inRange = data.value >= targetMin && data.value <= targetMax;
                    return (
                      <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
                        <p className={cn("font-bold text-base",
                          inRange ? "text-green-600" : data.value < targetMin ? "text-red-600" : "text-orange-600"
                        )}>
                          {data.value} {profile.glucose_unit}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {data.fullTime}
                        </p>
                      </div>
                    );
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  dot={(dotProps) => (
                    <GlucoseDot
                      key={dotProps.index}
                      {...dotProps}
                      targetMin={targetMin}
                      targetMax={targetMax}
                      dotSize={dotSize}
                    />
                  )}
                  activeDot={{ r: 7, stroke: "#14b8a6", strokeWidth: 2 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block size-2.5 rounded-full bg-green-500" />
                범위 내
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block size-2.5 rounded-full bg-orange-500" />
                높음
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block size-2.5 rounded-full bg-red-500" />
                낮음
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block size-1.5 h-3 border-l-2 border-dashed border-green-500" />
                목표범위
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
