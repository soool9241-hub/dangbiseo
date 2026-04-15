"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, Target, Syringe, Smartphone, Phone, Settings2, Info,
  Plus, X, Sun, Moon, LogOut, Loader2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NumberStepper } from "@/components/shared/NumberStepper";
import { useRecordsStore } from "@/stores/records-store";
import { useSync } from "@/components/shared/SupabaseSyncProvider";
import type { DiabetesType, GlucoseUnit, InsulinType } from "@/types/database";

const diabetesTypeLabels: Record<DiabetesType, string> = {
  type1: "1형 당뇨",
  type2: "2형 당뇨",
  gestational: "임신성 당뇨",
  lada: "LADA",
};

const insulinTypeLabels: Record<InsulinType, string> = {
  rapid: "초속효성",
  short: "속효성",
  intermediate: "중간형",
  long: "지속형",
  mixed: "혼합형",
};

export default function SettingsPage() {
  const router = useRouter();
  const { profile, resetStore } = useRecordsStore();
  const { updateProfile: setProfile } = useSync();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const [newInsulinName, setNewInsulinName] = useState("");
  const [newInsulinType, setNewInsulinType] = useState<InsulinType>("rapid");
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    resetStore();
    router.push("/login");
  };

  const addInsulin = () => {
    if (!newInsulinName.trim()) return;
    setProfile({
      preferred_insulins: [
        ...profile.preferred_insulins,
        { name: newInsulinName.trim(), type: newInsulinType },
      ],
    });
    setNewInsulinName("");
  };

  const removeInsulin = (index: number) => {
    setProfile({
      preferred_insulins: profile.preferred_insulins.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4 py-6">
      <h1 className="text-2xl font-bold">설정</h1>

      {/* Profile */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4" />
            프로필
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.email && (
            <div className="space-y-1.5">
              <Label>이메일</Label>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="display-name">이름</Label>
            <Input
              id="display-name"
              value={profile.display_name}
              onChange={(e) => setProfile({ display_name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>당뇨 유형</Label>
            <Select
              value={profile.diabetes_type}
              onValueChange={(v) => setProfile({ diabetes_type: v as DiabetesType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(diabetesTypeLabels) as [DiabetesType, string][]).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Targets */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="size-4" />
            목표 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>목표 혈당 최저 ({profile.glucose_unit})</Label>
            <NumberStepper
              value={profile.target_glucose_min}
              onChange={(v) => setProfile({ target_glucose_min: v })}
              min={50}
              max={profile.target_glucose_max - 10}
              step={5}
              unit={profile.glucose_unit}
              size="sm"
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>목표 혈당 최고 ({profile.glucose_unit})</Label>
            <NumberStepper
              value={profile.target_glucose_max}
              onChange={(v) => setProfile({ target_glucose_max: v })}
              min={profile.target_glucose_min + 10}
              max={300}
              step={5}
              unit={profile.glucose_unit}
              size="sm"
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>목표 HbA1c (%)</Label>
            <NumberStepper
              value={profile.target_hba1c}
              onChange={(v) => setProfile({ target_hba1c: Math.round(v * 10) / 10 })}
              min={5.0}
              max={10.0}
              step={0.1}
              unit="%"
              size="sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Insulin presets */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Syringe className="size-4" />
            인슐린 프리셋
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile.preferred_insulins.map((insulin, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
              <div>
                <p className="font-medium text-sm">{insulin.name}</p>
                <p className="text-xs text-muted-foreground">{insulinTypeLabels[insulin.type]}</p>
              </div>
              <Button variant="ghost" size="icon" className="size-8" onClick={() => removeInsulin(idx)}>
                <X className="size-4" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              placeholder="인슐린 이름"
              value={newInsulinName}
              onChange={(e) => setNewInsulinName(e.target.value)}
              className="flex-1"
            />
            <Select value={newInsulinType} onValueChange={(v) => setNewInsulinType(v as InsulinType)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(insulinTypeLabels) as [InsulinType, string][]).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="icon" onClick={addInsulin} disabled={!newInsulinName.trim()}>
              <Plus className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Device */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="size-4" />
            기기 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cgm-model">CGM 모델</Label>
            <Input
              id="cgm-model"
              placeholder="예: 덱스콤 G7"
              value={profile.cgm_model || ""}
              onChange={(e) => setProfile({ cgm_model: e.target.value || null, cgm_user: !!e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pump-model">인슐린 펌프 모델</Label>
            <Input
              id="pump-model"
              placeholder="예: 메드트로닉 780G"
              value={profile.pump_model || ""}
              onChange={(e) => setProfile({ pump_model: e.target.value || null, pump_user: !!e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency contacts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="size-4" />
            비상 연락처
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="emergency-name">이름</Label>
            <Input
              id="emergency-name"
              placeholder="비상 연락처 이름"
              value={profile.emergency_contact_name || ""}
              onChange={(e) => setProfile({ emergency_contact_name: e.target.value || null })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emergency-phone">전화번호</Label>
            <Input
              id="emergency-phone"
              type="tel"
              placeholder="010-0000-0000"
              value={profile.emergency_contact_phone || ""}
              onChange={(e) => setProfile({ emergency_contact_phone: e.target.value || null })}
            />
          </div>
        </CardContent>
      </Card>

      {/* App settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="size-4" />
            앱 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
              <Label>다크 모드</Label>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label>혈당 단위</Label>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={profile.glucose_unit === "mg/dL" ? "default" : "outline"}
                onClick={() => setProfile({ glucose_unit: "mg/dL" as GlucoseUnit })}
              >
                mg/dL
              </Button>
              <Button
                size="sm"
                variant={profile.glucose_unit === "mmol/L" ? "default" : "outline"}
                onClick={() => setProfile({ glucose_unit: "mmol/L" as GlucoseUnit })}
              >
                mmol/L
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="size-4" />
            앱 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">버전</span>
            <Badge variant="secondary">0.1.0</Badge>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground leading-relaxed">
            이 앱은 의료기기가 아닙니다. 모든 의료 결정은 담당 의료진과 상의하세요.
            당비서는 당뇨 관리를 돕기 위한 보조 도구이며, 의학적 진단이나 치료를 대체하지 않습니다.
          </p>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full h-11 text-destructive border-destructive/30 hover:bg-destructive/10"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            로그아웃 중...
          </>
        ) : (
          <>
            <LogOut className="size-4" />
            로그아웃
          </>
        )}
      </Button>
    </div>
  );
}
