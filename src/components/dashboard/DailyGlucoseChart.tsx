"use client";

import { useMemo } from "react";
import { isToday, format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceArea,
  Tooltip,
  Dot,
} from "recharts";
import { Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { useRecordsStore } from "@/stores/records-store";

interface ChartDataPoint {
  time: string;
  value: number;
  timestamp: number;
}

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

  return <Dot cx={cx} cy={cy} r={5} fill={fill} stroke="white" strokeWidth={2} />;
}

export function DailyGlucoseChart() {
  const { glucoseRecords, profile } = useRecordsStore();
  const targetMin = profile.target_glucose_min;
  const targetMax = profile.target_glucose_max;

  const chartData = useMemo(() => {
    return glucoseRecords
      .filter((r) => isToday(new Date(r.measured_at)))
      .map((r) => ({
        time: format(new Date(r.measured_at), "HH:mm"),
        value: r.value,
        timestamp: new Date(r.measured_at).getTime(),
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [glucoseRecords]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4 text-teal-500" />
          오늘의 혈당
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="혈당 기록이 없습니다"
            description="오늘의 첫 혈당을 기록해보세요."
            className="py-8"
          />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
            >
              <ReferenceArea
                y1={targetMin}
                y2={targetMax}
                fill="#14b8a6"
                fillOpacity={0.1}
                strokeOpacity={0}
              />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                domain={[
                  (dataMin: number) => Math.min(dataMin - 10, targetMin - 10),
                  (dataMax: number) => Math.max(dataMax + 10, targetMax + 10),
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
                  return (
                    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
                      <p className="font-medium">
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
                activeDot={{ r: 6, stroke: "#14b8a6", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
