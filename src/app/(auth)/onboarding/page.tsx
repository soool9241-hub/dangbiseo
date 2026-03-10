"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Syringe,
  Heart,
  Target,
  Phone,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRecordsStore } from "@/stores/records-store";
import type { DiabetesType, InsulinType } from "@/types/database";

const TOTAL_STEPS = 4;

const diabetesTypes: { value: DiabetesType; label: string; description: string }[] = [
  { value: "type1", label: "1형 당뇨", description: "자가면역으로 인한 인슐린 결핍" },
  { value: "type2", label: "2형 당뇨", description: "인슐린 저항성 중심" },
  { value: "gestational", label: "임신성 당뇨", description: "임신 중 발생한 당뇨" },
  { value: "lada", label: "LADA", description: "성인 잠복 자가면역 당뇨" },
];

const insulinOptions: { name: string; type: InsulinType; category: string }[] = [
  { name: "노보래피드", type: "rapid", category: "초속효" },
  { name: "휴마로그", type: "rapid", category: "초속효" },
  { name: "피아스프", type: "rapid", category: "초속효" },
  { name: "트레시바", type: "long", category: "지속형" },
  { name: "란투스", type: "long", category: "지속형" },
  { name: "레버미어", type: "long", category: "지속형" },
];

const cgmModels = ["덱스콤 G6", "덱스콤 G7", "리브레", "기타"];

export default function OnboardingPage() {
  const router = useRouter();
  const setProfile = useRecordsStore((s) => s.setProfile);

  const [step, setStep] = useState(1);

  // Step 1
  const [diabetesType, setDiabetesType] = useState<DiabetesType | null>(null);
  const [diagnosisDate, setDiagnosisDate] = useState("");

  // Step 2
  const [selectedInsulins, setSelectedInsulins] = useState<
    { name: string; type: InsulinType }[]
  >([]);
  const [pumpUser, setPumpUser] = useState(false);
  const [cgmUser, setCgmUser] = useState(false);
  const [cgmModel, setCgmModel] = useState<string | null>(null);

  // Step 3
  const [targetMin, setTargetMin] = useState(70);
  const [targetMax, setTargetMax] = useState(180);
  const [targetHba1c, setTargetHba1c] = useState(7.0);

  // Step 4
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  function toggleInsulin(insulin: { name: string; type: InsulinType }) {
    setSelectedInsulins((prev) => {
      const exists = prev.find((i) => i.name === insulin.name);
      if (exists) return prev.filter((i) => i.name !== insulin.name);
      return [...prev, { name: insulin.name, type: insulin.type }];
    });
  }

  function canProceed(): boolean {
    switch (step) {
      case 1:
        return diabetesType !== null;
      case 2:
        return true;
      case 3:
        return targetMin > 0 && targetMax > targetMin && targetHba1c > 0;
      case 4:
        return true;
      default:
        return false;
    }
  }

  function handleNext() {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  function handleComplete() {
    setProfile({
      diabetes_type: diabetesType!,
      diagnosis_date: diagnosisDate || null,
      preferred_insulins: selectedInsulins,
      pump_user: pumpUser,
      pump_model: null,
      cgm_user: cgmUser,
      cgm_model: cgmUser ? cgmModel : null,
      target_glucose_min: targetMin,
      target_glucose_max: targetMax,
      target_hba1c: targetHba1c,
      emergency_contact_name: emergencyName || null,
      emergency_contact_phone: emergencyPhone || null,
      onboarding_completed: true,
    });
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-teal-600">당비서</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          맞춤 설정 ({step}/{TOTAL_STEPS})
        </p>
      </div>

      {/* Progress */}
      <Progress value={(step / TOTAL_STEPS) * 100} />

      {/* Step Content */}
      <div className="min-h-[400px]">
        {step === 1 && (
          <StepDiabetesType
            selected={diabetesType}
            onSelect={setDiabetesType}
            diagnosisDate={diagnosisDate}
            onDiagnosisDateChange={setDiagnosisDate}
          />
        )}
        {step === 2 && (
          <StepInsulin
            selectedInsulins={selectedInsulins}
            onToggleInsulin={toggleInsulin}
            pumpUser={pumpUser}
            onPumpUserChange={setPumpUser}
            cgmUser={cgmUser}
            onCgmUserChange={setCgmUser}
            cgmModel={cgmModel}
            onCgmModelChange={setCgmModel}
          />
        )}
        {step === 3 && (
          <StepGoals
            targetMin={targetMin}
            targetMax={targetMax}
            targetHba1c={targetHba1c}
            onTargetMinChange={setTargetMin}
            onTargetMaxChange={setTargetMax}
            onTargetHba1cChange={setTargetHba1c}
          />
        )}
        {step === 4 && (
          <StepEmergency
            name={emergencyName}
            phone={emergencyPhone}
            onNameChange={setEmergencyName}
            onPhoneChange={setEmergencyPhone}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 1 && (
          <Button
            variant="outline"
            className="h-11 flex-1"
            onClick={handleBack}
          >
            <ChevronLeft className="size-4" />
            이전
          </Button>
        )}
        <Button
          className="h-11 flex-1 bg-teal-600 text-white hover:bg-teal-700"
          onClick={handleNext}
          disabled={!canProceed()}
        >
          {step === TOTAL_STEPS ? (
            <>
              시작하기
              <Check className="size-4" />
            </>
          ) : (
            <>
              다음
              <ChevronRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 1: Diabetes Type                                              */
/* ------------------------------------------------------------------ */
function StepDiabetesType({
  selected,
  onSelect,
  diagnosisDate,
  onDiagnosisDateChange,
}: {
  selected: DiabetesType | null;
  onSelect: (v: DiabetesType) => void;
  diagnosisDate: string;
  onDiagnosisDateChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Heart className="size-5 text-teal-600" />
        <h2 className="text-lg font-semibold">어떤 유형의 당뇨인가요?</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {diabetesTypes.map((dt) => (
          <Card
            key={dt.value}
            className={`cursor-pointer transition-all ${
              selected === dt.value
                ? "ring-2 ring-teal-600 bg-teal-50 dark:bg-teal-950"
                : "hover:ring-1 hover:ring-teal-300"
            }`}
            onClick={() => onSelect(dt.value)}
          >
            <CardContent className="flex flex-col gap-1 py-1">
              <p className="font-semibold">{dt.label}</p>
              <p className="text-xs text-muted-foreground">{dt.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="diagnosis-date">언제 진단받으셨나요?</Label>
        <Input
          id="diagnosis-date"
          type="date"
          value={diagnosisDate}
          onChange={(e) => onDiagnosisDateChange(e.target.value)}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2: Insulin Settings                                           */
/* ------------------------------------------------------------------ */
function StepInsulin({
  selectedInsulins,
  onToggleInsulin,
  pumpUser,
  onPumpUserChange,
  cgmUser,
  onCgmUserChange,
  cgmModel,
  onCgmModelChange,
}: {
  selectedInsulins: { name: string; type: InsulinType }[];
  onToggleInsulin: (i: { name: string; type: InsulinType }) => void;
  pumpUser: boolean;
  onPumpUserChange: (v: boolean) => void;
  cgmUser: boolean;
  onCgmUserChange: (v: boolean) => void;
  cgmModel: string | null;
  onCgmModelChange: (v: string | null) => void;
}) {
  const isSelected = (name: string) =>
    selectedInsulins.some((i) => i.name === name);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Syringe className="size-5 text-teal-600" />
        <h2 className="text-lg font-semibold">
          사용 중인 인슐린을 선택해주세요
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {insulinOptions.map((ins) => (
          <Card
            key={ins.name}
            className={`cursor-pointer transition-all ${
              isSelected(ins.name)
                ? "ring-2 ring-teal-600 bg-teal-50 dark:bg-teal-950"
                : "hover:ring-1 hover:ring-teal-300"
            }`}
            onClick={() => onToggleInsulin({ name: ins.name, type: ins.type })}
          >
            <CardContent className="flex items-center gap-2 py-0.5">
              <div
                className={`flex size-5 shrink-0 items-center justify-center rounded border ${
                  isSelected(ins.name)
                    ? "border-teal-600 bg-teal-600 text-white"
                    : "border-muted-foreground/30"
                }`}
              >
                {isSelected(ins.name) && <Check className="size-3" />}
              </div>
              <div>
                <p className="text-sm font-medium">{ins.name}</p>
                <p className="text-xs text-muted-foreground">{ins.category}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="pump-toggle" className="cursor-pointer">
            인슐린 펌프를 사용하시나요?
          </Label>
          <Switch
            id="pump-toggle"
            checked={pumpUser}
            onCheckedChange={onPumpUserChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="cgm-toggle" className="cursor-pointer">
            CGM(연속혈당측정기)을 사용하시나요?
          </Label>
          <Switch
            id="cgm-toggle"
            checked={cgmUser}
            onCheckedChange={onCgmUserChange}
          />
        </div>

        {cgmUser && (
          <div className="flex flex-col gap-1.5">
            <Label>CGM 모델</Label>
            <Select
              value={cgmModel ?? undefined}
              onValueChange={(v) => onCgmModelChange(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="모델을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {cgmModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 3: Goals                                                      */
/* ------------------------------------------------------------------ */
function StepGoals({
  targetMin,
  targetMax,
  targetHba1c,
  onTargetMinChange,
  onTargetMaxChange,
  onTargetHba1cChange,
}: {
  targetMin: number;
  targetMax: number;
  targetHba1c: number;
  onTargetMinChange: (v: number) => void;
  onTargetMaxChange: (v: number) => void;
  onTargetHba1cChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Target className="size-5 text-teal-600" />
        <h2 className="text-lg font-semibold">목표 설정</h2>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>혈당 목표 범위 (mg/dL)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={targetMin}
                onChange={(e) => onTargetMinChange(Number(e.target.value))}
                className="text-center"
                min={40}
                max={200}
              />
              <span className="text-muted-foreground">~</span>
              <Input
                type="number"
                value={targetMax}
                onChange={(e) => onTargetMaxChange(Number(e.target.value))}
                className="text-center"
                min={100}
                max={400}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hba1c-target">당화혈색소 목표 (%)</Label>
            <Input
              id="hba1c-target"
              type="number"
              step="0.1"
              value={targetHba1c}
              onChange={(e) => onTargetHba1cChange(Number(e.target.value))}
              min={4}
              max={14}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 rounded-lg bg-teal-50 p-3 dark:bg-teal-950/50">
        <Info className="mt-0.5 size-4 shrink-0 text-teal-600" />
        <p className="text-xs leading-relaxed text-teal-800 dark:text-teal-300">
          대부분의 내분비내과 전문의는 70-180 mg/dL, 당화혈색소 7.0% 이하를
          권장합니다
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 4: Emergency Contact                                          */
/* ------------------------------------------------------------------ */
function StepEmergency({
  name,
  phone,
  onNameChange,
  onPhoneChange,
}: {
  name: string;
  phone: string;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Phone className="size-5 text-teal-600" />
        <h2 className="text-lg font-semibold">비상 연락처</h2>
      </div>

      <p className="text-sm text-muted-foreground">
        긴급 상황 시 연락할 사람을 등록해주세요
      </p>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emergency-name">이름</Label>
            <Input
              id="emergency-name"
              placeholder="보호자 이름"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emergency-phone">전화번호</Label>
            <Input
              id="emergency-phone"
              type="tel"
              placeholder="010-0000-0000"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        나중에 설정에서 등록할 수도 있어요
      </p>
    </div>
  );
}
