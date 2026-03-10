import Link from "next/link";
import { Zap, BarChart3, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Zap,
    title: "15초 기록",
    description: "빠른 혈당·인슐린 기록",
  },
  {
    icon: BarChart3,
    title: "맞춤 분석",
    description: "개인별 트렌드와 패턴 분석",
  },
  {
    icon: ShieldAlert,
    title: "비상 가이드",
    description: "저혈당 대응 가이드 오프라인 지원",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col font-sans">
      {/* Hero Section */}
      <section className="relative flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-teal-600 to-teal-800 px-6 py-16 text-center text-white">
        <div className="mx-auto flex max-w-md flex-col items-center gap-6">
          <h1 className="text-5xl font-bold tracking-tight">당비서</h1>
          <p className="text-xl font-medium text-teal-100">
            당뇨 관리의 든든한 비서
          </p>
          <p className="text-base leading-relaxed text-teal-200">
            혈당, 인슐린, 식단, 운동, 감정까지
            <br />한 곳에서 관리하세요
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-background px-6 py-10">
        <div className="mx-auto grid max-w-md gap-4">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                  <feature.icon className="size-6" />
                </div>
                <div>
                  <p className="font-medium">{feature.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-background px-6 pb-10">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <Link
            href="/onboarding"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-teal-600 text-base font-semibold text-white transition-colors hover:bg-teal-700"
          >
            시작하기
          </Link>
          <Link
            href="/login"
            className="flex h-9 items-center justify-center rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            이미 계정이 있어요
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <footer className="bg-muted/50 px-6 py-4 text-center">
        <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground">
          이 앱은 의료기기가 아니며, 의료적 조언을 대체하지 않습니다.
        </p>
      </footer>
    </div>
  );
}
