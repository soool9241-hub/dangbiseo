"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Camera,
  Upload,
  Loader2,
  Sparkles,
  Save,
  X,
  FileText,
  Plus,
} from "lucide-react";
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

type UploadedFile = {
  id: string;
  name: string;
  data: string; // base64 data URL
  mimeType: string;
  size: number;
  isPdf: boolean;
};

export default function NewLabReportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Resize image to max 1200px for OCR (reduces base64 size significantly)
  const resizeImage = (dataUrl: string, maxSize: number): Promise<string> =>
    new Promise((resolve) => {
      const img = document.createElement("img");
      img.onload = () => {
        const { width, height } = img;
        if (width <= maxSize && height <= maxSize) {
          resolve(dataUrl);
          return;
        }
        const ratio = Math.min(maxSize / width, maxSize / height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = dataUrl;
    });

  const readFile = (file: File): Promise<UploadedFile> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          data: reader.result as string,
          mimeType:
            file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
          size: file.size,
          isPdf: file.type === "application/pdf" || file.name.endsWith(".pdf"),
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const MAX_FILES = 20;
  const MAX_TOTAL_SIZE = 30 * 1024 * 1024;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const remaining = MAX_FILES - files.length;
    if (remaining <= 0) {
      toast.error(`최대 ${MAX_FILES}개까지만 업로드할 수 있어요`);
      e.target.value = "";
      return;
    }

    let toAdd = selected;
    if (selected.length > remaining) {
      toast.error(`${remaining}개만 추가됩니다 (최대 ${MAX_FILES}개)`);
      toAdd = selected.slice(0, remaining);
    }

    const totalSize = [...files, ...toAdd].reduce(
      (sum, f) => sum + ("size" in f ? f.size : 0),
      0
    );
    if (totalSize > MAX_TOTAL_SIZE) {
      toast.error("전체 파일 크기가 30MB를 초과했습니다");
      e.target.value = "";
      return;
    }

    try {
      const newFiles = await Promise.all(toAdd.map(readFile));
      setFiles((prev) => [...prev, ...newFiles]);
      setResult(null); // reset analysis when files change
    } catch {
      toast.error("파일을 읽는 중 오류가 발생했습니다");
    }

    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setResult(null);
  };

  // Step 1: Upload button → extract text via Gemini
  // Files are sent in batches of 3 to stay under Vercel's 4.5MB body limit
  const handleAnalyze = async () => {
    if (files.length === 0 || !user) return;

    setAnalyzing(true);
    try {
      const supabase = createClient();
      const { data: previousReports } = await supabase
        .from("lab_reports")
        .select("lab_values")
        .eq("user_id", user.id)
        .order("tested_at", { ascending: false })
        .limit(1);

      const previousValues = previousReports?.[0]?.lab_values || [];

      // Resize images for API (keeps PDF as-is, compresses images to 1200px)
      const compressedFiles = await Promise.all(
        files.map(async (f) => {
          if (f.isPdf) return { data: f.data, mimeType: f.mimeType };
          const resized = await resizeImage(f.data, 1200);
          return { data: resized, mimeType: "image/jpeg" };
        })
      );

      // Split into batches of 3 to avoid body size limit
      const BATCH_SIZE = 3;
      const batches: { data: string; mimeType: string }[][] = [];
      for (let i = 0; i < compressedFiles.length; i += BATCH_SIZE) {
        batches.push(compressedFiles.slice(i, i + BATCH_SIZE));
      }

      let mergedResult: AnalysisResult | null = null;

      for (let i = 0; i < batches.length; i++) {
        const response = await fetch("/api/lab-report/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: batches[i],
            previousValues: i === 0 ? previousValues : [],
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "분석 실패");
        }

        const batchResult: AnalysisResult = await response.json();

        if (!mergedResult) {
          mergedResult = batchResult;
        } else {
          // Merge lab_values from subsequent batches (deduplicate by name)
          const existingNames = new Set(mergedResult.lab_values.map((v) => v.name));
          for (const v of batchResult.lab_values) {
            if (!existingNames.has(v.name)) {
              mergedResult.lab_values.push(v);
              existingNames.add(v.name);
            }
          }
          // Use first batch's metadata (tested_at, hospital_name, summary, etc.)
          if (!mergedResult.tested_at && batchResult.tested_at) {
            mergedResult.tested_at = batchResult.tested_at;
          }
          if (!mergedResult.hospital_name && batchResult.hospital_name) {
            mergedResult.hospital_name = batchResult.hospital_name;
          }
        }
      }

      if (!mergedResult) throw new Error("분석 결과가 없습니다");

      setResult(mergedResult);
      toast.success(`${mergedResult.lab_values.length}개 항목을 추출했어요`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "분석 중 오류가 발생했습니다");
    } finally {
      setAnalyzing(false);
    }
  };

  // Step 2: Save button → save original files + extracted data
  const handleSave = async () => {
    if (!result || files.length === 0 || !user) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const thumbnail = files.find((f) => !f.isPdf)?.data || files[0]?.data || null;

      const filesToSave = files.map((f) => ({
        name: f.name,
        data: f.data,
        mimeType: f.mimeType,
        size: f.size,
        isPdf: f.isPdf,
      }));

      const { error } = await supabase.from("lab_reports").insert({
        user_id: user.id,
        tested_at: result.tested_at || new Date().toISOString().split("T")[0],
        hospital_name: result.hospital_name,
        image_url: thumbnail,
        files: filesToSave,
        lab_values: result.lab_values,
        ai_summary: result.ai_summary,
        ai_analysis: result.ai_analysis,
        ai_recommendations: result.ai_recommendations,
        comparison_note: result.comparison_note || null,
      });

      if (error) throw error;

      toast.success("저장 완료!");
      router.push("/lab-reports");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "저장 중 오류가 발생했습니다");
      setSaving(false);
    }
  };

  const abnormalCount = result
    ? result.lab_values.filter(
        (v) => v.status === "high" || v.status === "low" || v.status === "critical"
      ).length
    : 0;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const busy = analyzing || saving;

  return (
    <div className="py-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} disabled={busy}>
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-xl font-bold">검사지 업로드</h1>
      </div>

      {files.length === 0 ? (
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
                <p className="text-xs text-muted-foreground mt-1">검사지를 바로 촬영하세요</p>
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
                <p className="font-semibold">파일 업로드 (다중 선택)</p>
                <p className="text-xs text-muted-foreground mt-1">
                  이미지 · PDF · 최대 20개
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
            accept="image/*,application/pdf,.pdf"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          <Card className="bg-muted/50 border-dashed">
            <CardContent className="py-4 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">📋 사용 방법</p>
              <ul className="space-y-1 ml-3">
                <li>
                  1. <b>파일 선택</b> — 한 번에 여러 장 선택 가능 (최대 20개 · 30MB)
                </li>
                <li>
                  2. <b>업로드(분석)</b> — AI가 검사지 텍스트를 자동 추출
                </li>
                <li>
                  3. <b>저장</b> — 원본 파일 + 추출 데이터를 내 기록으로 저장
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Files preview list */}
          <div className="space-y-2">
            {files.map((f) => (
              <Card key={f.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {f.isPdf ? (
                      <div className="size-14 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center shrink-0">
                        <FileText className="size-7 text-red-600 dark:text-red-400" />
                      </div>
                    ) : (
                      <div className="size-14 rounded-lg overflow-hidden bg-muted shrink-0">
                        <Image
                          src={f.data}
                          alt={f.name}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.isPdf ? "PDF" : "이미지"} · {formatSize(f.size)}
                      </p>
                    </div>
                    {!busy && !result && (
                      <button
                        onClick={() => removeFile(f.id)}
                        className="size-8 rounded-full hover:bg-muted flex items-center justify-center shrink-0"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {!busy && !result && files.length < MAX_FILES && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-muted-foreground/30 py-3 text-sm text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/30 transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="size-4" />
                파일 추가 ({files.length}/{MAX_FILES})
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,.pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Step 1: Upload/Analyze button */}
          {!result && !analyzing && (
            <Button
              onClick={handleAnalyze}
              className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-base font-semibold"
            >
              <Sparkles className="size-4 mr-1" />
              업로드 · AI 텍스트 추출 ({files.length}/{MAX_FILES})
            </Button>
          )}

          {analyzing && (
            <Card className="border-teal-200 bg-teal-50 dark:bg-teal-950/30 dark:border-teal-800">
              <CardContent className="flex items-center gap-3 py-6">
                <Loader2 className="size-5 animate-spin text-teal-600 dark:text-teal-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-teal-900 dark:text-teal-100">
                    AI가 {files.length}개 파일을 분석 중...
                  </p>
                  <p className="text-xs text-teal-700 dark:text-teal-300 mt-0.5">
                    텍스트 추출에는 10~60초 정도 소요돼요
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Analysis preview + Save */}
          {result && (
            <>
              <Card>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-base">추출 결과 미리보기</h3>
                      {result.hospital_name && (
                        <p className="text-xs text-muted-foreground">
                          {result.hospital_name} · {result.tested_at}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">항목</p>
                      <p className="text-lg font-bold">{result.lab_values.length}</p>
                    </div>
                  </div>
                  {abnormalCount > 0 && (
                    <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 px-3 py-2 text-sm text-orange-800 dark:text-orange-300">
                      ⚠️ 이상 수치 <b>{abnormalCount}개</b> 발견
                    </div>
                  )}
                  {result.ai_summary && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {result.ai_summary}
                    </p>
                  )}
                </CardContent>
              </Card>

              {result.lab_values.length > 0 && (
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
                          <p
                            className={`text-base font-bold tabular-nums ${
                              v.status === "high" || v.status === "critical"
                                ? "text-red-600 dark:text-red-400"
                                : v.status === "low"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-foreground"
                            }`}
                          >
                            {v.value}{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              {v.unit}
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setResult(null)}
                  disabled={saving}
                  className="flex-1 h-12"
                >
                  다시 분석
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-[2] h-12 bg-teal-600 hover:bg-teal-700 text-base font-semibold"
                >
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-1" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="size-4 mr-1" />
                      내 기록으로 저장
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
