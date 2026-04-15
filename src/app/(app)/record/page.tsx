"use client";

import Link from "next/link";
import {
  Droplets,
  Syringe,
  UtensilsCrossed,
  Dumbbell,
  Heart,
  FileText,
} from "lucide-react";
import { useRecordsStore } from "@/stores/records-store";
import { isToday } from "date-fns";

const recordTypes = [
  {
    label: "혈당 기록",
    href: "/record/glucose",
    icon: Droplets,
    bg: "bg-teal-500",
    bgLight: "bg-teal-50 dark:bg-teal-950/40",
    iconColor: "text-teal-600 dark:text-teal-400",
    storeKey: "glucoseRecords" as const,
    dateField: "measured_at",
  },
  {
    label: "인슐린 기록",
    href: "/record/insulin",
    icon: Syringe,
    bg: "bg-blue-500",
    bgLight: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    storeKey: "insulinRecords" as const,
    dateField: "injected_at",
  },
  {
    label: "식단 기록",
    href: "/record/meal",
    icon: UtensilsCrossed,
    bg: "bg-orange-500",
    bgLight: "bg-orange-50 dark:bg-orange-950/40",
    iconColor: "text-orange-600 dark:text-orange-400",
    storeKey: "mealRecords" as const,
    dateField: "eaten_at",
  },
  {
    label: "운동 기록",
    href: "/record/exercise",
    icon: Dumbbell,
    bg: "bg-green-500",
    bgLight: "bg-green-50 dark:bg-green-950/40",
    iconColor: "text-green-600 dark:text-green-400",
    storeKey: "exerciseRecords" as const,
    dateField: "started_at",
  },
  {
    label: "기분 기록",
    href: "/record/mood",
    icon: Heart,
    bg: "bg-pink-500",
    bgLight: "bg-pink-50 dark:bg-pink-950/40",
    iconColor: "text-pink-600 dark:text-pink-400",
    storeKey: "moodRecords" as const,
    dateField: "recorded_at",
  },
] as const;

function getTodayCount(
  records: { [key: string]: string }[],
  dateField: string
): number {
  return records.filter((r) => {
    const val = r[dateField];
    return val ? isToday(new Date(val)) : false;
  }).length;
}

export default function RecordHubPage() {
  const store = useRecordsStore();

  return (
    <div className="py-6 space-y-6">
      <h1 className="text-2xl font-bold">기록하기</h1>

      <div className="grid grid-cols-2 gap-3">
        {recordTypes.map((rt) => {
          const Icon = rt.icon;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const records = store[rt.storeKey] as any[];
          const todayCount = getTodayCount(records, rt.dateField);

          return (
            <Link
              key={rt.href}
              href={rt.href}
              className={`${rt.bgLight} rounded-2xl p-5 flex flex-col items-center justify-center gap-3 min-h-[140px] active:scale-95 transition-transform`}
            >
              <div
                className={`${rt.bg} rounded-full p-3 text-white`}
              >
                <Icon className="size-7" />
              </div>
              <span className="font-semibold text-sm">{rt.label}</span>
              <span className="text-xs text-muted-foreground">
                오늘 {todayCount}건
              </span>
            </Link>
          );
        })}
      </div>

      {/* Lab Reports - Featured */}
      <Link
        href="/lab-reports"
        className="block rounded-2xl p-5 bg-gradient-to-br from-teal-500 to-teal-600 text-white active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-4">
          <div className="bg-white/20 rounded-full p-3">
            <FileText className="size-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">검사 기록 📸</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-semibold">AI</span>
            </div>
            <p className="text-xs text-white/90 mt-0.5">
              검사지 사진 업로드 → AI 자동 분석
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
