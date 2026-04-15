"use client";

import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { ko } from "date-fns/locale/ko";
import { FlaskConical, Plus, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { NumberStepper } from "@/components/shared/NumberStepper";
import { useRecordsStore } from "@/stores/records-store";
import { useSync } from "@/components/shared/SupabaseSyncProvider";

export default function HbA1cPage() {
  const { hba1cRecords, profile } = useRecordsStore();
  const { addHbA1cRecord } = useSync();
  const [showForm, setShowForm] = useState(false);
  const [formValue, setFormValue] = useState(7.0);
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formLab, setFormLab] = useState("");

  const chartData = useMemo(
    () =>
      [...hba1cRecords]
        .sort((a, b) => new Date(a.tested_at).getTime() - new Date(b.tested_at).getTime())
        .map((r) => ({
          date: format(new Date(r.tested_at), "yy/M", { locale: ko }),
          value: r.value,
          fullDate: format(new Date(r.tested_at), "yyyy년 M월 d일", { locale: ko }),
        })),
    [hba1cRecords]
  );

  const sortedRecords = useMemo(
    () => [...hba1cRecords].sort((a, b) => new Date(b.tested_at).getTime() - new Date(a.tested_at).getTime()),
    [hba1cRecords]
  );

  const handleSubmit = () => {
    addHbA1cRecord({
      value: formValue,
      tested_at: formDate,
      lab_name: formLab || null,
      note: null,
    });
    setShowForm(false);
    setFormValue(7.0);
    setFormLab("");
  };

  return (
    <div className="space-y-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">당화혈색소 (HbA1c)</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "default"}>
          <Plus className="mr-1 size-4" />
          기록 추가
        </Button>
      </div>

      {/* Info card */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
        <CardContent className="flex gap-3 py-3">
          <Info className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            당화혈색소는 최근 2-3개월간의 평균 혈당을 반영합니다. 목표는 보통 7.0% 이하이며, 담당 의료진과 상의하여 개인 목표를 설정하세요.
          </p>
        </CardContent>
      </Card>

      {/* Add form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">새 기록 추가</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <Label>HbA1c 값 (%)</Label>
              <NumberStepper value={formValue} onChange={setFormValue} min={4} max={15} step={0.1} unit="%" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hba1c-date">검사일</Label>
              <Input
                id="hba1c-date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hba1c-lab">검사 기관</Label>
              <Input
                id="hba1c-lab"
                placeholder="예: 서울대병원"
                value={formLab}
                onChange={(e) => setFormLab(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="flex-1">저장</Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">취소</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">HbA1c 추이</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[4, 12]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [`${value}%`, "HbA1c"]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ""}
                />
                <ReferenceLine y={profile.target_hba1c} stroke="#22c55e" strokeDasharray="5 5" label={{ value: `목표 ${profile.target_hba1c}%`, position: "right", fontSize: 11, fill: "#22c55e" }} />
                <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 5, fill: "#ef4444" }} name="HbA1c" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">데이터가 없습니다</p>
          )}
        </CardContent>
      </Card>

      {/* History list */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">검사 기록</h2>
        {sortedRecords.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">기록이 없습니다</p>
        ) : (
          sortedRecords.map((record) => (
            <Card key={record.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <FlaskConical className="size-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{record.value}%</span>
                    {record.value <= profile.target_hba1c ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">목표 달성</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">목표 초과</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(record.tested_at), "yyyy년 M월 d일", { locale: ko })}
                    {record.lab_name && ` · ${record.lab_name}`}
                  </p>
                  {record.note && <p className="mt-0.5 text-xs text-muted-foreground">{record.note}</p>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
