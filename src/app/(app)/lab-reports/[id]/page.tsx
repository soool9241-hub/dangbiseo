"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { ko } from "date-fns/locale/ko";
import { ArrowLeft, Sparkles, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { LabReport } from "@/types/database";

export default function LabReportDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [report, setReport] = useState<LabReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      if (!user || !params.id) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("lab_reports")
        .select("*")
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single();
      setReport(data as LabReport);
      setLoading(false);
    }
    fetchReport();
  }, [user, params.id]);

  const handleDelete = async () => {
    if (!report || !user) return;
    if (!confirm("이 검사 기록을 삭제하시겠어요?")) return;

    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("lab_reports")
      .delete()
      .eq("id", report.id)
      .eq("user_id", user.id);

    if (error) {
      toast.error("삭제 실패");
      setDeleting(false);
      return;
    }
    toast.success("삭제되었습니다");
    router.push("/lab-reports");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">검사 기록을 찾을 수 없습니다</p>
        <Button variant="outline" onClick={() => router.push("/lab-reports")} className="mt-4">
          목록으로
        </Button>
      </div>
    );
  }

  const abnormalCount = (report.lab_values || []).filter(
    (v) => v.status === "high" || v.status === "low" || v.status === "critical"
  ).length;

  // Group by category
  const grouped = (report.lab_values || []).reduce<Record<string, typeof report.lab_values>>(
    (acc, v) => {
      const cat = v.category || "기타";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(v);
      return acc;
    },
    {}
  );

  return (
    <div className="py-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-xl font-bold">검사 상세</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={deleting}
          className="text-destructive"
        >
          {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </Button>
      </div>

      {/* Header card */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="font-bold text-lg">
                {format(new Date(report.tested_at), "yyyy년 M월 d일", { locale: ko })}
              </h2>
              {report.hospital_name && (
                <p className="text-sm text-muted-foreground">{report.hospital_name}</p>
              )}
            </div>
            {abnormalCount > 0 ? (
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                이상 {abnormalCount}개
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                정상
              </Badge>
            )}
          </div>
          {report.ai_summary && (
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              {report.ai_summary}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Image */}
      {report.image_url && (
        <Card>
          <CardContent className="p-2">
            <Image
              src={report.image_url}
              alt="검사지"
              width={800}
              height={600}
              className="w-full h-auto rounded-lg"
              unoptimized
            />
          </CardContent>
        </Card>
      )}

      {/* Lab values grouped by category */}
      {Object.entries(grouped).map(([category, values]) => (
        <Card key={category}>
          <CardContent className="py-4">
            <h3 className="font-semibold text-base mb-3">{category}</h3>
            <div className="space-y-2">
              {values.map((v, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium">{v.name}</p>
                      {v.status === "high" && (
                        <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] h-4 px-1.5">높음</Badge>
                      )}
                      {v.status === "low" && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] h-4 px-1.5">낮음</Badge>
                      )}
                      {v.status === "critical" && (
                        <Badge variant="secondary" className="bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300 text-[10px] h-4 px-1.5">심각</Badge>
                      )}
                    </div>
                    {v.reference_range && (
                      <p className="text-xs text-muted-foreground">
                        정상: {v.reference_range} {v.unit}
                      </p>
                    )}
                  </div>
                  <p
                    className={`text-base font-bold tabular-nums ${
                      v.status === "high" || v.status === "critical"
                        ? "text-red-600 dark:text-red-400"
                        : v.status === "low"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-foreground"
                    }`}
                  >
                    {v.value} <span className="text-xs font-normal text-muted-foreground">{v.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* AI Analysis */}
      {report.ai_analysis && (
        <Card>
          <CardContent className="py-4">
            <h3 className="font-semibold text-base mb-2">
              <Sparkles className="inline size-4 mr-1 text-teal-600" />
              AI 상세 분석
            </h3>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {report.ai_analysis}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {report.ai_recommendations && report.ai_recommendations.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <h3 className="font-semibold text-base mb-3">💡 권고사항</h3>
            <ul className="space-y-2">
              {report.ai_recommendations.map((rec, idx) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <span className="text-teal-600 dark:text-teal-400">•</span>
                  <span className="flex-1 text-muted-foreground">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Comparison */}
      {report.comparison_note && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
          <CardContent className="py-4">
            <h3 className="font-semibold text-base mb-2">📊 이전 회차 대비</h3>
            <p className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
              {report.comparison_note}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
