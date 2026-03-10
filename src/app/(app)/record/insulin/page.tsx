"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberStepper } from "@/components/shared/NumberStepper";
import { useRecordsStore } from "@/stores/records-store";
import type { InsulinType, InjectionSite } from "@/types/database";
import { cn } from "@/lib/utils";

const injectionSites: { value: InjectionSite; label: string; emoji: string }[] = [
  { value: "abdomen", label: "배", emoji: "🫃" },
  { value: "thigh", label: "허벅지", emoji: "🦵" },
  { value: "arm", label: "팔", emoji: "💪" },
  { value: "hip", label: "엉덩이", emoji: "🍑" },
];

export default function InsulinRecordPage() {
  const router = useRouter();
  const addInsulinRecord = useRecordsStore((s) => s.addInsulinRecord);
  const preferredInsulins = useRecordsStore((s) => s.profile.preferred_insulins);

  const [selectedInsulin, setSelectedInsulin] = useState(
    preferredInsulins.length > 0 ? preferredInsulins[0].name : ""
  );
  const [insulinType, setInsulinType] = useState<InsulinType>(
    preferredInsulins.length > 0 ? preferredInsulins[0].type : "rapid"
  );
  const [isCustom, setIsCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [dose, setDose] = useState(5);
  const [site, setSite] = useState<InjectionSite>("abdomen");

  const handleSelectInsulin = (name: string, type: InsulinType) => {
    setSelectedInsulin(name);
    setInsulinType(type);
    setIsCustom(false);
  };

  const handleCustom = () => {
    setIsCustom(true);
    setSelectedInsulin("");
  };

  const handleSubmit = () => {
    const name = isCustom ? customName.trim() : selectedInsulin;
    if (!name) {
      toast.error("인슐린 이름을 입력해 주세요");
      return;
    }
    if (dose <= 0) {
      toast.error("투여량을 입력해 주세요");
      return;
    }
    addInsulinRecord({
      insulin_name: name,
      insulin_type: insulinType,
      dose,
      injected_at: new Date().toISOString(),
      injection_site: site,
      note: null,
    });
    toast.success("인슐린이 기록되었습니다");
    router.back();
  };

  return (
    <div className="py-4 flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-xl font-bold">인슐린 기록</h1>
      </div>

      {/* Insulin selector */}
      <div className="space-y-2 mb-6">
        <label className="text-sm font-medium text-muted-foreground">
          인슐린 종류
        </label>
        <div className="flex flex-wrap gap-2">
          {preferredInsulins.map((ins) => (
            <button
              key={ins.name}
              onClick={() => handleSelectInsulin(ins.name, ins.type)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                selectedInsulin === ins.name && !isCustom
                  ? "bg-blue-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {ins.name}
              <span className="ml-1 text-xs opacity-70">
                ({ins.type === "rapid" ? "초속효" : ins.type === "long" ? "지속형" : ins.type})
              </span>
            </button>
          ))}
          <button
            onClick={handleCustom}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
              isCustom
                ? "bg-blue-500 text-white"
                : "bg-muted text-muted-foreground"
            )}
          >
            기타
          </button>
        </div>
        {isCustom && (
          <div className="space-y-2 pt-2">
            <Input
              placeholder="인슐린 이름 입력"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
            <div className="flex gap-2">
              {(
                [
                  { value: "rapid" as InsulinType, label: "초속효" },
                  { value: "short" as InsulinType, label: "속효" },
                  { value: "intermediate" as InsulinType, label: "중간형" },
                  { value: "long" as InsulinType, label: "지속형" },
                  { value: "mixed" as InsulinType, label: "혼합형" },
                ] as const
              ).map((t) => (
                <button
                  key={t.value}
                  onClick={() => setInsulinType(t.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    insulinType === t.value
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dose */}
      <div className="space-y-2 mb-6">
        <label className="text-sm font-medium text-muted-foreground">
          투여량
        </label>
        <div className="flex justify-center">
          <NumberStepper
            value={dose}
            onChange={setDose}
            min={0}
            max={50}
            step={0.5}
            unit="단위 (U)"
            size="lg"
          />
        </div>
      </div>

      {/* Injection site */}
      <div className="space-y-2 mb-6">
        <label className="text-sm font-medium text-muted-foreground">
          주사 부위
        </label>
        <div className="grid grid-cols-4 gap-2">
          {injectionSites.map((s) => (
            <button
              key={s.value}
              onClick={() => setSite(s.value)}
              className={cn(
                "flex flex-col items-center gap-1 py-3 rounded-xl text-sm font-medium transition-colors",
                site === s.value
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 ring-2 ring-blue-500"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <span className="text-2xl">{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white text-base font-semibold rounded-xl mt-auto"
      >
        기록하기
      </Button>
    </div>
  );
}
