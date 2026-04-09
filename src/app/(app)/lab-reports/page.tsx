"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale/ko";
import { FileText, Plus, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { LabReport } from "@/types/database";

export default function LabReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">검사 기록</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            검사지를 사진으로 업로드하면 AI가 분석해드려요
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
        <div className="space-y-3">
          {reports.map((report) => {
            const abnormal = abnormalCount(report);
            return (
              <Link key={report.id} href={`/lab-reports/${report.id}`}>
                <Card className="active:scale-[0.98] transition-transform">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {format(new Date(report.tested_at), "yyyy년 M월 d일", { locale: ko })}
                          </h3>
                          {abnormal > 0 ? (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                              <AlertCircle className="size-3 mr-0.5" />
                              이상 {abnormal}개
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle2 className="size-3 mr-0.5" />
                              정상
                            </Badge>
                          )}
                        </div>
                        {report.hospital_name && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {report.hospital_name}
                          </p>
                        )}
                        {report.ai_summary && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {report.ai_summary}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          검사 항목 {(report.lab_values || []).length}개
                        </p>
                      </div>
                      <FileText className="size-5 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
