"use client";

import { useMemo, useState } from "react";
import { isToday, format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  Dot,
} from "recharts";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { useRecordsStore } from "@/stores/records-store";

interface ChartDataPoint {
  time: string;
  value: number;
  timestamp: number;
  minuteOfDay: number;
}

const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => h * 60);
const HOUR_LABELS: Record<number, string> = {
  0: "0시",
  180: "3시",
  360: "6시",
  540: "9시",
  720: "12시",
  900: "15시",
  1080: "18시",
  1260: "21시",
  1440: "24���",
};

function GlucoseDot(props: {
  cx?: number;
  cy?: number;
  payload?: ChartDataPoint;
  targetMin: number;
  targetMax: number;
}) {
  const { cx, cy, payload, targetMin, targetMax } = props;
  if (cx == null || cy == null || !payload) return null;

  let fill = "#22c55e"; // green - in range
  if (payload.value < targetMin) fill = "#ef4444"; // red - low
  else if (payload.value > targetMax) fill = "#f97316"; // orange - high

  return <Dot cx={cx} cy={cy} r={6} fill={fill} stroke="white" strokeWidth={2} />;
}

export function DailyGlucoseChart() {
  const { glucoseRecords, profile } = useRecordsStore();
  const targetMin = profile.target_glucose_min;
  const targetMax = profile.target_glucose_max;
  const [dayOffset, setDayOffset] = useState(0);

  const selectedDate = useMemo(() => {
    return dayOffset === 0 ? new Date() : subDays(new Date(), dayOffset);
  }, [dayOffset]);

  const dateLabel = useMemo(() => {
    if (dayOffset === 0) return "오늘";
    if (dayOffset === 1) return "어제";
    return format(selectedDate, "M월 d일");
  }, [dayOffset, selectedDate]);

  const chartData = useMemo(() => {
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);

    return glucoseRecords
      .filter((r) => {
        const d = new Date(r.measured_at);
        return d >= dayStart && d <= dayEnd;
      })
      .map((r) => {
        const d = new Date(r.measured_at);
        const minuteOfDay = d.getHours() * 60 + d.getMinutes();
        return {
          time: format(d, "HH:mm"),
          value: r.value,
          timestamp: d.getTime(),
          minuteOfDay,
        };
      })
      .sort((a, b) => a.minuteOfDay - b.minuteOfDay);
  }, [glucoseRecords, selectedDate]);

  // Calculate stats
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

  // Current time indicator (minute of day)
  const nowMinute = useMemo(() => {
    if (dayOffset !== 0) return null;
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, [dayOffset]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-4 text-teal-500" />
            24시간 혈당
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setDayOffset((d) => d + 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-xs font-medium text-muted-foreground min-w-[50px] text-center">
              {dateLabel}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              disabled={dayOffset === 0}
              onClick={() => setDayOffset((d) => Math.max(0, d - 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="혈당 기록이 없습니다"
            description={dayOffset === 0 ? "오늘의 첫 혈당을 기록해보세요." : `${dateLabel} 기록이 없습니다.`}
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
                  <span className={`font-bold ${stats.tir >= 70 ? "text-green-600" : stats.tir >= 50 ? "text-orange-500" : "text-red-500"}`}>
                    {stats.tir}%
                  </span>
                  <span className="text-muted-foreground ml-1">({stats.count}회)</span>
                </div>
              </div>
            )}

            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
              >
                {/* Target range */}
                <ReferenceArea
                  x1={0}
                  x2={1440}
                  y1={targetMin}
                  y2={targetMax}
                  fill="#14b8a6"
                  fillOpacity={0.08}
                  strokeOpacity={0}
                />

                {/* Current time indicator */}
                {nowMinute !== null && (
                  <ReferenceLine
                    x={nowMinute}
                    stroke="#14b8a6"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{ value: "지금", position: "top", fontSize: 10, fill: "#14b8a6" }}
                  />
                )}

                {/* Target lines */}
                <ReferenceLine y={targetMin} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={targetMax} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1} />

                <XAxis
                  dataKey="minuteOfDay"
                  type="number"
                  domain={[0, 1440]}
                  ticks={HOUR_TICKS}
                  tickFormatter={(v) => HOUR_LABELS[v] || ""}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
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
                        <p className={`font-bold text-base ${inRange ? "text-green-600" : data.value < targetMin ? "text-red-600" : "text-orange-600"}`}>
                          {data.value} {profile.glucose_unit}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {data.time}
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
                    />
                  )}
                  activeDot={{ r: 8, stroke: "#14b8a6", strokeWidth: 2 }}
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
