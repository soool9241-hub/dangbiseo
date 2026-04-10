"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSync } from "@/components/shared/SupabaseSyncProvider";
import type { InsulinType, InjectionSite } from "@/types/database";
import { cn } from "@/lib/utils";

const insulinCategories: {
  type: InsulinType;
  label: string;
  examples: { name: string; type: InsulinType }[];
}[] = [
  {
    type: "rapid",
    label: "속효성 (식사용)",
    examples: [
      { name: "노보래피드", type: "rapid" },
      { name: "휴마로그", type: "rapid" },
      { name: "피아스프", type: "rapid" },
      { name: "애피드라", type: "rapid" },
    ],
  },
  {
    type: "long",
    label: "지속성 (기저용)",
    examples: [
      { name: "트레시바", type: "long" },
      { name: "란투스", type: "long" },
      { name: "레버미어", type: "long" },
      { name: "투제오", type: "long" },
    ],
  },
];

const injectionSites: { value: InjectionSite; label: string }[] = [
  { value: "abdomen", label: "배" },
  { value: "thigh", label: "허벅지" },
  { value: "arm", label: "팔" },
  { value: "hip", label: "엉덩이" },
];

export default function InsulinRecordPage() {
  const router = useRouter();
  const { addInsulinRecord } = useSync();

  const [selectedName, setSelectedName] = useState("노보래피드");
  const [selectedType, setSelectedType] = useState<InsulinType>("rapid");
  const [customName, setCustomName] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [dose, setDose] = useState("");
  const [site, setSite] = useState<InjectionSite>("abdomen");
  const [recordTime, setRecordTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const handleSelect = (name: string, type: InsulinType) => {
    setSelectedName(name);
    setSelectedType(type);
    setIsCustom(false);
  };

  const handleSubmit = () => {
    const name = isCustom ? customName.trim() : selectedName;
    if (!name) {
      toast.error("인슐린을 선택해 주세요");
      return;
    }
    const doseVal = parseFloat(dose);
    if (!dose || isNaN(doseVal) || doseVal <= 0) {
      toast.error("단위를 입력해 주세요");
      return;
    }
    addInsulinRecord({
      insulin_name: name,
      insulin_type: selectedType,
      dose: doseVal,
      injected_at: new Date(recordTime).toISOString(),
      injection_site: site,
      note: null,
    });
    toast.success("인슐린이 기록되었습니다");
    router.back();
  };

  return (
    <div className="py-4 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-xl font-bold">인슐린 기록</h1>
      </div>

      {/* Insulin type + name selection */}
      {insulinCategories.map((cat) => (
        <div key={cat.type}>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {cat.label}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {cat.examples.map((ins) => (
              <button
                key={ins.name}
                onClick={() => handleSelect(ins.name, ins.type)}
                className={cn(
                  "py-3 rounded-xl text-sm font-semibold transition-colors",
                  selectedName === ins.name && !isCustom
                    ? cat.type === "rapid"
                      ? "bg-blue-500 text-white"
                      : "bg-violet-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {ins.name}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Custom insulin */}
      <button
        onClick={() => {
          setIsCustom(true);
          setSelectedName("");
        }}
        className={cn(
          "w-full py-2.5 rounded-xl text-sm font-medium transition-colors",
          isCustom ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"
        )}
      >
        기타 인슐린 직접 입력
      </button>
      {isCustom && (
        <Input
          placeholder="인슐린 이름"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          autoFocus
        />
      )}

      {/* Dose — simple number input */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">단위 (U)</p>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 5, 10].map((v) => (
            <button
              key={v}
              onClick={() => setDose(String(v))}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                dose === String(v)
                  ? "bg-blue-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {v}
            </button>
          ))}
          <Input
            type="number"
            placeholder="직접"
            value={dose}
            onChange={(e) => setDose(e.target.value)}
            className="w-20 h-10 text-center font-semibold"
            step="0.5"
            min="0"
          />
        </div>
      </div>

      {/* Time */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">투여 시간</p>
        <input
          type="datetime-local"
          value={recordTime}
          onChange={(e) => setRecordTime(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border bg-background text-sm"
        />
      </div>

      {/* Injection site */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">주사 부위</p>
        <div className="grid grid-cols-4 gap-2">
          {injectionSites.map((s) => (
            <button
              key={s.value}
              onClick={() => setSite(s.value)}
              className={cn(
                "py-3 rounded-xl text-sm font-semibold transition-colors",
                site === s.value
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 ring-2 ring-blue-500"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!dose}
        className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white text-base font-semibold rounded-xl"
      >
        기록하기
      </Button>
    </div>
  );
}
