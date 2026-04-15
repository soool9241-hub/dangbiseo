"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { ko } from "date-fns/locale/ko";
import {
  Droplet, Syringe, UtensilsCrossed, Dumbbell, SmilePlus, Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRecordsStore } from "@/stores/records-store";

type RecordType = "glucose" | "insulin" | "meal" | "exercise" | "mood";

const typeConfig: Record<RecordType, { label: string; icon: typeof Droplet; color: string }> = {
  glucose: { label: "혈당", icon: Droplet, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  insulin: { label: "인슐린", icon: Syringe, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  meal: { label: "식단", icon: UtensilsCrossed, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  exercise: { label: "운동", icon: Dumbbell, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  mood: { label: "기분", icon: SmilePlus, color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" },
};

const moodEmojis: Record<string, string> = {
  great: "😄", good: "🙂", neutral: "😐", bad: "😟", terrible: "😢",
};

interface TimelineItem {
  id: string;
  type: RecordType;
  timestamp: Date;
  primaryValue: string;
  secondaryValue?: string;
  glucoseColor?: string;
}

function getGlucoseColor(value: number, min: number, max: number): string {
  if (value < min) return "text-red-600 dark:text-red-400";
  if (value > max) return "text-orange-600 dark:text-orange-400";
  return "text-green-600 dark:text-green-400";
}

function getDateGroup(date: Date): string {
  if (isToday(date)) return "오늘";
  if (isYesterday(date)) return "어제";
  return format(date, "M월 d일 (EEEE)", { locale: ko });
}

export default function HistoryPage() {
  const { glucoseRecords, insulinRecords, mealRecords, exerciseRecords, moodRecords, profile } = useRecordsStore();
  const [activeFilters, setActiveFilters] = useState<Set<RecordType>>(new Set(["glucose", "insulin", "meal", "exercise", "mood"]));

  const toggleFilter = (type: RecordType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const timeline = useMemo(() => {
    const items: TimelineItem[] = [];

    if (activeFilters.has("glucose")) {
      glucoseRecords.forEach((r) =>
        items.push({
          id: r.id,
          type: "glucose",
          timestamp: new Date(r.measured_at),
          primaryValue: `${r.value} mg/dL`,
          glucoseColor: getGlucoseColor(r.value, profile.target_glucose_min, profile.target_glucose_max),
        })
      );
    }

    if (activeFilters.has("insulin")) {
      insulinRecords.forEach((r) =>
        items.push({
          id: r.id,
          type: "insulin",
          timestamp: new Date(r.injected_at),
          primaryValue: `${r.dose}U`,
          secondaryValue: r.insulin_name,
        })
      );
    }

    if (activeFilters.has("meal")) {
      mealRecords.forEach((r) =>
        items.push({
          id: r.id,
          type: "meal",
          timestamp: new Date(r.eaten_at),
          primaryValue: `${r.total_carbs}g 탄수화물`,
          secondaryValue: r.total_calories ? `${r.total_calories}kcal` : undefined,
        })
      );
    }

    if (activeFilters.has("exercise")) {
      exerciseRecords.forEach((r) =>
        items.push({
          id: r.id,
          type: "exercise",
          timestamp: new Date(r.started_at),
          primaryValue: `${r.duration_minutes}분`,
          secondaryValue: r.exercise_type,
        })
      );
    }

    if (activeFilters.has("mood")) {
      moodRecords.forEach((r) =>
        items.push({
          id: r.id,
          type: "mood",
          timestamp: new Date(r.recorded_at),
          primaryValue: moodEmojis[r.mood] || r.mood,
          secondaryValue: r.note || undefined,
        })
      );
    }

    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [glucoseRecords, insulinRecords, mealRecords, exerciseRecords, moodRecords, activeFilters, profile]);

  const grouped = useMemo(() => {
    const groups: { label: string; items: TimelineItem[] }[] = [];
    let currentLabel = "";

    timeline.forEach((item) => {
      const label = getDateGroup(item.timestamp);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, items: [] });
      }
      groups[groups.length - 1].items.push(item);
    });

    return groups;
  }, [timeline]);

  return (
    <div className="space-y-4 py-6">
      <h1 className="text-2xl font-bold">기록 히스토리</h1>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        <Filter className="size-4 text-muted-foreground mt-1.5" />
        {(Object.entries(typeConfig) as [RecordType, typeof typeConfig.glucose][]).map(([type, config]) => (
          <Button
            key={type}
            size="sm"
            variant={activeFilters.has(type) ? "default" : "outline"}
            onClick={() => toggleFilter(type)}
            className="gap-1"
          >
            <config.icon className="size-3.5" />
            {config.label}
          </Button>
        ))}
      </div>

      {/* Timeline */}
      {grouped.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">기록이 없습니다</p>
      ) : (
        grouped.map((group) => (
          <div key={group.label}>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground sticky top-0 bg-background py-1 z-10">
              {group.label}
            </h2>
            <div className="space-y-2">
              {group.items.map((item) => {
                const cfg = typeConfig[item.type];
                const Icon = cfg.icon;
                return (
                  <Card key={item.id}>
                    <CardContent className="flex items-center gap-3 py-3">
                      <div className={`flex size-10 items-center justify-center rounded-full ${cfg.color}`}>
                        <Icon className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={cfg.color}>
                            {cfg.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(item.timestamp, { locale: ko, addSuffix: true })}
                          </span>
                        </div>
                        <p className={`mt-0.5 text-lg font-bold ${item.glucoseColor || ""}`}>
                          {item.primaryValue}
                        </p>
                        {item.secondaryValue && (
                          <p className="text-xs text-muted-foreground">{item.secondaryValue}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
