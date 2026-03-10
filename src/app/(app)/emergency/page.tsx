"use client";

import {
  Phone, AlertTriangle, ArrowDown, ArrowUp, Heart, Candy, Droplets, Ban,
  ChevronDown, ChevronUp, User,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useRecordsStore } from "@/stores/records-store";

function CollapsibleSection({
  title,
  icon: Icon,
  iconColor,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: typeof AlertTriangle;
  iconColor: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <Icon className={`size-5 ${iconColor}`} />
        <span className="flex-1 font-semibold">{title}</span>
        {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>
      {open && (
        <CardContent className="pt-0 pb-4">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

export default function EmergencyPage() {
  const { profile } = useRecordsStore();

  return (
    <div className="space-y-4 py-6">
      <h1 className="text-2xl font-bold">응급 가이드</h1>

      {/* Emergency call button */}
      <a href="tel:119" className="block">
        <Button
          size="lg"
          className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-6 gap-2 shadow-lg"
        >
          <Phone className="size-6" />
          119 응급 전화
        </Button>
      </a>

      {/* Emergency contact */}
      {profile.emergency_contact_name && profile.emergency_contact_phone && (
        <a href={`tel:${profile.emergency_contact_phone}`} className="block">
          <Card className="border-orange-200 dark:border-orange-800">
            <CardContent className="flex items-center gap-3 py-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <User className="size-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">비상 연락처</p>
                <p className="font-semibold">{profile.emergency_contact_name}</p>
              </div>
              <Phone className="size-5 text-orange-600 dark:text-orange-400" />
            </CardContent>
          </Card>
        </a>
      )}

      {/* 저혈당 대응 */}
      <CollapsibleSection title="저혈당 대응 가이드" icon={ArrowDown} iconColor="text-red-500" defaultOpen={true}>
        <div className="space-y-3">
          <div className="flex gap-3">
            <Badge variant="secondary" className="shrink-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">1</Badge>
            <div>
              <p className="font-medium">증상 확인</p>
              <p className="text-sm text-muted-foreground">떨림, 식은땀, 어지러움, 심장 빠름, 손발 저림, 배고픔</p>
            </div>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Badge variant="secondary" className="shrink-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">2</Badge>
            <div>
              <p className="font-medium">혈당 측정 (가능한 경우)</p>
              <p className="text-sm text-muted-foreground">70 mg/dL 미만이면 저혈당으로 판단</p>
            </div>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Badge variant="secondary" className="shrink-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">3</Badge>
            <div>
              <p className="font-medium">의식이 있는 경우</p>
              <p className="text-sm text-muted-foreground">포도당 15-20g 또는 주스 150ml 섭취</p>
            </div>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Badge variant="secondary" className="shrink-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">4</Badge>
            <div>
              <p className="font-medium">15분 후 재측정</p>
              <p className="text-sm text-muted-foreground">혈당이 정상 범위(70 이상)로 회복되었는지 확인</p>
            </div>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Badge variant="secondary" className="shrink-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">5</Badge>
            <div>
              <p className="font-medium">여전히 낮으면 반복</p>
              <p className="text-sm text-muted-foreground">포도당 15g을 다시 섭취하고 15분 후 재측정</p>
            </div>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Badge variant="secondary" className="shrink-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">6</Badge>
            <div>
              <p className="font-medium text-red-600 dark:text-red-400">의식이 없는 경우</p>
              <p className="text-sm text-muted-foreground">즉시 119 호출. 글루카곤 투여 (보유 시). 입에 음식물을 넣지 마세요.</p>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* 고혈당 대응 */}
      <CollapsibleSection title="고혈당 대응 가이드" icon={ArrowUp} iconColor="text-orange-500">
        <div className="space-y-3">
          <div className="flex gap-3">
            <Badge variant="secondary" className="shrink-0 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">1</Badge>
            <div>
              <p className="font-medium">300 mg/dL 이상이면 케톤 검사</p>
              <p className="text-sm text-muted-foreground">소변 또는 혈중 케톤 검사 실시</p>
            </div>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Badge variant="secondary" className="shrink-0 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">2</Badge>
            <div>
              <p className="font-medium">교정 인슐린 투여</p>
              <p className="text-sm text-muted-foreground">담당 의료진이 지시한 교정 용량에 따라 투여</p>
            </div>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Badge variant="secondary" className="shrink-0 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">3</Badge>
            <div>
              <p className="font-medium">수분 섭취</p>
              <p className="text-sm text-muted-foreground">물을 충분히 마시세요 (무설탕 음료)</p>
            </div>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Badge variant="secondary" className="shrink-0 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">4</Badge>
            <div>
              <p className="font-medium">운동 금지 (케톤 양성 시)</p>
              <p className="text-sm text-muted-foreground">케톤이 검출된 경우 운동하면 상태가 악화될 수 있습니다</p>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Quick snack reference */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Candy className="size-5 text-pink-500" />
            저혈당 간식 참고
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm">포도당 사탕 1개</span>
              <Badge variant="secondary">4g 탄수화물</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm">주스 한잔 (200ml)</span>
              <Badge variant="secondary">26g 탄수화물</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm">사탕 3개</span>
              <Badge variant="secondary">15g 탄수화물</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm">포도당 젤 1포</span>
              <Badge variant="secondary">15g 탄수화물</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-muted">
        <CardContent className="py-3">
          <p className="text-center text-xs text-muted-foreground">
            이 가이드는 일반적인 참고 정보입니다. 개인별 대응 방법은 담당 의료진과 상의하세요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
