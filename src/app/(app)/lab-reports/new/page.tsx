"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Camera, Upload, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { LabValue } from "@/types/database";

type AnalysisResult = {
  tested_at: string;
  hospital_name: string | null;
  lab_values: LabValue[];
  ai_summary: string;
  ai_analysis: string;
  ai_recommendations: string[];
  comparison_note?: string;
};

export default function NewLabReportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("이미지는 8MB 이하여야 합니다");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setMimeType(file.type || "image/jpeg");
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!image || !user) return;

    setAnalyzing(true);
    try {
      // Fetch previous lab values for comparison
      const supabase = createClient();
      const { data: previousReports } = await supabase
        .from("lab_reports")
        .select("lab_values")
        .eq("user_id", user.id)
        .order("tested_at", { ascending: false })
        .limit(1);

      const previousValues = previousReports?.[0]?.lab_values || [];

      const response = await fetch("/api/lab-report/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, mimeType, previousValues }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "분석 실패");
      }

      const data = await response.json();
      setResult(data);
      toast.success("분석 완료!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "분석 중 오류가 발생했습니다"
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!result || !user) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("lab_reports").insert({
        user_id: user.id,
        tested_at: result.tested_at || new Date().toISOString().split("T")[0],
        hospital_name: result.hospital_name,
        image_url: image, // base64 stored directly
        lab_values: result.lab_values,
        ai_summary: result.ai_summary,
        ai_analysis: result.ai_analysis,
        ai_recommendations: result.ai_recommendations,
        comparison_note: result.comparison_note || null,
      });

      if (error) throw error;
      toast.success("저장되었습니다");
      router.push("/lab-reports");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "저장 중 오류가 발생했습니다"
      );
    } finally {
      setSaving(false);
    }
  };

  const abnormalCount = result
    ? result.lab_values.filter(
        (v) => v.status === "high" || v.status === "low" || v.status === "critical"
      ).length
    : 0;

  return (
    <div className="py-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-xl font-bold">검사지 업로드</h1>
      </div>

      {!image ? (
        <div className="space-y-3">
          <Card
            className="cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => cameraInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center gap-3 py-10">
              <div className="size-14 rounded-full bg-teal-100 dark:bg-teal-950/40 flex items-center justify-center">
                <Camera className="size-7 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold">카메라로 촬영</p>
                <p className="text-xs text-muted-foreground mt-1">
                  검사지를 바로 촬영하세요
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center gap-3 py-10">
              <div className="size-14 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                <Upload className="size-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold">갤러리에서 선택</p>
                <p className="text-xs text-muted-foreground mt-1">
                  저장된 사진을 업로드하세요
                </p>
              </div>
            </CardContent>
          </Card>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <Card className="bg-muted/50 border-dashed">
            <CardContent className="py-4 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">📋 촬영 팁</p>
              <ul className="space-y-1 ml-3">
                <li>• 검사지 전체가 화면에 나오도록 촬영하세요</li>
                <li>• 밝은 곳에서 글자가 선명하게 보이도록 하세요</li>
                <li>• 그림자나 빛 반사를 피해주세요</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image preview */}
          <div className="relative rounded-xl overflow-hidden border">
            <Image
              src={image}
              alt="검사지"
              width={800}
              height={600}
              className="w-full h-auto max-h-80 object-contain bg-muted"
              unoptimized
            />
            {!result && (
              <button
                onClick={() => setImage(null)}
                className="absolute top-2 right-2 size-8 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {!result && !analyzing && (
            <Button
              onClick={handleAnalyze}
              className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-base font-semibold"
            >
              <Sparkles className="size-4 mr-1" />
              AI로 분석하기
            </Button>
          )}

          {analyzing && (
            <Card className="border-teal-200 bg-teal-50 dark:bg-teal-950/30 dark:border-teal-800">
              <CardContent className="flex items-center gap-3 py-6">
                <Loader2 className="size-5 animate-spin text-teal-600 dark:text-teal-400" />
                <div>
                  <p className="font-semibold text-teal-900 dark:text-teal-100">
                    AI 분석 중...
                  </p>
                  <p className="text-xs text-teal-700 dark:text-teal-300 mt-0.5">
                    검사 항목을 추출하고 해석하고 있어요 (10-30초)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              {/* Summary */}
              <Card>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-base">검사 요약</h3>
                      {result.hospital_name && (
                        <p className="text-xs text-muted-foreground">
                          {result.hospital_name} · {result.tested_at}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">항목</p>
                      <p className="text-lg font-bold">
                        {result.lab_values.length}
                      </p>
                    </div>
                  </div>
                  {abnormalCount > 0 && (
                    <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 px-3 py-2 text-sm text-orange-800 dark:text-orange-300">
                      ⚠️ 이상 수치 <b>{abnormalCount}개</b> 발견
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {result.ai_summary}
                  </p>
                </CardContent>
              </Card>

              {/* Lab values */}
              <Card>
                <CardContent className="py-4">
                  <h3 className="font-semibold text-base mb-3">검사 항목</h3>
                  <div className="space-y-2">
                    {result.lab_values.map((v, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{v.name}</p>
                          {v.reference_range && (
                            <p className="text-xs text-muted-foreground">
                              정상: {v.reference_range} {v.unit}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
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
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Analysis */}
              {result.ai_analysis && (
                <Card>
                  <CardContent className="py-4">
                    <h3 className="font-semibold text-base mb-2">
                      <Sparkles className="inline size-4 mr-1 text-teal-600" />
                      AI 상세 분석
                    </h3>
                    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {result.ai_analysis}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {result.ai_recommendations && result.ai_recommendations.length > 0 && (
                <Card>
                  <CardContent className="py-4">
                    <h3 className="font-semibold text-base mb-3">💡 권고사항</h3>
                    <ul className="space-y-2">
                      {result.ai_recommendations.map((rec, idx) => (
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
              {result.comparison_note && (
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
                  <CardContent className="py-4">
                    <h3 className="font-semibold text-base mb-2">📊 이전 회차 대비</h3>
                    <p className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
                      {result.comparison_note}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Save button */}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-base font-semibold"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-1" />
                    저장 중...
                  </>
                ) : (
                  "저장하기"
                )}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
