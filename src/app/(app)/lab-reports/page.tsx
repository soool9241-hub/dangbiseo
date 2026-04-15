"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale/ko";
import { FileText, Plus, AlertCircle, CheckCircle2, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { LabReport } from "@/types/database";

export default function LabReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function fetchReports() {
      if (!user) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("lab_reports")
        .select("*")
        .eq("user_id", user.id)
        .order("tested_at", { ascending: false });
      setReports((data as LabReport[]) || []);
      setLoading(false);
    }
    fetchReports();
  }, [user]);

  const abnormalCount = (r: LabReport) =>
    (r.lab_values || []).filter(
      (v) => v.status === "high" || v.status === "low" || v.status === "critical"
    ).length;

  // Group by year → month
  const grouped = useMemo(() => {
    const map = new Map<number, Map<number, LabReport[]>>();
    for (const r of reports) {
      const d = new Date(r.tested_at);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      if (!map.has(year)) map.set(year, new Map());
      const yearMap = map.get(year)!;
      if (!yearMap.has(month)) yearMap.set(month, []);
      yearMap.get(month)!.push(r);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, monthMap]) => ({
        year,
        months: Array.from(monthMap.entries())
          .sort((a, b) => b[0] - a[0])
          .map(([month, items]) => ({ month, items })),
        total: Array.from(monthMap.values()).reduce((s, arr) => s + arr.length, 0),
      }));
  }, [reports]);

  const toggleYear = (year: number) => {
    setCollapsedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">검사 기록</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            연도 · 월별 누적 기록
          </p>
        </div>
        <Link href="/lab-reports/new">
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-1 size-4" />
            새 검사
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <div className="size-14 rounded-full bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center">
              <FileText className="size-7 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold">아직 등록된 검사가 없어요</p>
              <p className="text-sm text-muted-foreground mt-1">
                검사지 사진을 업로드하고 AI 분석을 받아보세요
              </p>
            </div>
            <Link href="/lab-reports/new">
              <Button className="bg-teal-600 hover:bg-teal-700 mt-2">
                <Plus className="mr-1 size-4" />
                첫 검사 등록
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ year, months, total }) => {
            const collapsed = collapsedYears.has(year);
            return (
              <section key={year}>
                <button
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center justify-between mb-3 sticky top-0 bg-background/90 backdrop-blur-sm py-2 z-10"
                >
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{year}년</h2>
                    <Badge variant="secondary" className="h-5 px-2 text-xs">
                      {total}건
                    </Badge>
                  </div>
                  <ChevronDown
                    className={cn(
                      "size-5 text-muted-foreground transition-transform",
                      collapsed && "-rotate-90"
                    )}
                  />
                </button>

                {!collapsed && (
                  <div className="relative pl-4 border-l-2 border-muted space-y-5">
                    {months.map(({ month, items }) => (
                      <div key={`${year}-${month}`} className="relative">
                        {/* Month dot */}
                        <div className="absolute -left-[22px] top-1 size-4 rounded-full bg-teal-500 border-4 border-background" />

                        <div className="mb-2">
                          <h3 className="text-sm font-bold text-muted-foreground">
                            {month}월
                            <span className="ml-2 font-normal text-xs">
                              ({items.length}건)
                            </span>
                          </h3>
                        </div>

                        <div className="space-y-2">
                          {items.map((report) => {
                            const abnormal = abnormalCount(report);
                            return (
                              <Link key={report.id} href={`/lab-reports/${report.id}`}>
                                <Card className="active:scale-[0.98] transition-transform hover:shadow-sm">
                                  <CardContent className="py-3">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                          <h4 className="font-semibold text-sm">
                                            {format(
                                              new Date(report.tested_at),
                                              "M월 d일 (eee)",
                                              { locale: ko }
                                            )}
                                          </h4>
                                          {abnormal > 0 ? (
                                            <Badge
                                              variant="secondary"
                                              className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 h-5 px-1.5 text-[10px]"
                                            >
                                              <AlertCircle className="size-3 mr-0.5" />
                                              이상 {abnormal}개
                                            </Badge>
                                          ) : (
                                            <Badge
                                              variant="secondary"
                                              className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 h-5 px-1.5 text-[10px]"
                                            >
                                              <CheckCircle2 className="size-3 mr-0.5" />
                                              정상
                                            </Badge>
                                          )}
                                        </div>
                                        {report.hospital_name && (
                                          <p className="text-xs text-muted-foreground">
                                            {report.hospital_name}
                                          </p>
                                        )}
                                        {report.ai_summary && (
                                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                            {report.ai_summary}
                                          </p>
                                        )}
                                        <p className="text-[11px] text-muted-foreground mt-1.5">
                                          검사 항목 {(report.lab_values || []).length}개
                                        </p>
                                      </div>
                                      <FileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                                    </div>
                                  </CardContent>
                                </Card>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
