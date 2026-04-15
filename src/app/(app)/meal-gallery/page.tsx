"use client";

import { useMemo, useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { ko } from "date-fns/locale/ko";
import { ArrowLeft, X, UtensilsCrossed, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useRecordsStore } from "@/stores/records-store";
import { cn } from "@/lib/utils";

const mealTypeLabels: Record<string, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

const mealTypeColors: Record<string, string> = {
  breakfast: "bg-yellow-500",
  lunch: "bg-orange-500",
  dinner: "bg-purple-500",
  snack: "bg-green-500",
};

function getDateLabel(date: Date): string {
  if (isToday(date)) return "오늘";
  if (isYesterday(date)) return "어제";
  return format(date, "M월 d일 (EEE)", { locale: ko });
}

interface MealWithPhoto {
  id: string;
  photo_url: string;
  meal_type: string;
  eaten_at: string;
  total_carbs: number;
  total_calories: number | null;
  note: string | null;
}

export default function MealGalleryPage() {
  const router = useRouter();
  const { mealRecords } = useRecordsStore();
  const [selectedMeal, setSelectedMeal] = useState<MealWithPhoto | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  // Only meals with photos
  const mealsWithPhotos = useMemo(() => {
    let filtered = mealRecords.filter((r) => r.photo_url) as MealWithPhoto[];
    if (filterType) {
      filtered = filtered.filter((r) => r.meal_type === filterType);
    }
    return filtered.sort(
      (a, b) => new Date(b.eaten_at).getTime() - new Date(a.eaten_at).getTime()
    );
  }, [mealRecords, filterType]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { label: string; date: string; meals: MealWithPhoto[] }[] = [];
    let currentDate = "";

    mealsWithPhotos.forEach((meal) => {
      const d = new Date(meal.eaten_at);
      const dateStr = format(d, "yyyy-MM-dd");
      if (dateStr !== currentDate) {
        currentDate = dateStr;
        groups.push({ label: getDateLabel(d), date: dateStr, meals: [] });
      }
      groups[groups.length - 1].meals.push(meal);
    });

    return groups;
  }, [mealsWithPhotos]);

  return (
    <div className="py-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-xl font-bold">식단 사진 갤러리</h1>
        <span className="text-sm text-muted-foreground ml-auto">
          {mealsWithPhotos.length}장
        </span>
      </div>

      {/* Meal type filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setFilterType(null)}
          className={cn(
            "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            !filterType
              ? "bg-orange-500 text-white"
              : "bg-muted text-muted-foreground"
          )}
        >
          전체
        </button>
        {Object.entries(mealTypeLabels).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilterType(filterType === value ? null : value)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              filterType === value
                ? "bg-orange-500 text-white"
                : "bg-muted text-muted-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Gallery */}
      {mealsWithPhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <UtensilsCrossed className="size-12 mb-3 opacity-30" />
          <p className="text-sm">아직 식단 사진이 없습니다</p>
          <p className="text-xs mt-1">식단 기록에서 사진을 촬영해보세요</p>
        </div>
      ) : (
        grouped.map((group) => (
          <div key={group.date} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="size-3.5 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground">
                {group.label}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {group.meals.map((meal) => (
                <button
                  key={meal.id}
                  onClick={() => setSelectedMeal(meal)}
                  className="relative rounded-xl overflow-hidden aspect-square bg-muted group"
                >
                  <img
                    src={meal.photo_url}
                    alt="식사 사진"
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "size-2 rounded-full",
                        mealTypeColors[meal.meal_type] || "bg-gray-500"
                      )} />
                      <span className="text-white text-xs font-medium">
                        {mealTypeLabels[meal.meal_type] || meal.meal_type}
                      </span>
                    </div>
                    <p className="text-white text-sm font-bold">
                      {meal.total_carbs}g
                      {meal.total_calories ? ` · ${meal.total_calories}kcal` : ""}
                    </p>
                  </div>
                  {/* Time badge */}
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-md">
                    {format(new Date(meal.eaten_at), "HH:mm")}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Full-screen photo modal */}
      {selectedMeal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          onClick={() => setSelectedMeal(null)}
        >
          {/* Close button */}
          <div className="flex justify-end p-4">
            <button className="size-10 rounded-full bg-white/10 text-white flex items-center justify-center">
              <X className="size-5" />
            </button>
          </div>

          {/* Photo */}
          <div className="flex-1 flex items-center justify-center px-4">
            <img
              src={selectedMeal.photo_url}
              alt="식사 사진"
              className="max-w-full max-h-[60vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Info */}
          <div
            className="p-4 pb-8 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium text-white",
                mealTypeColors[selectedMeal.meal_type] || "bg-gray-500"
              )}>
                {mealTypeLabels[selectedMeal.meal_type] || selectedMeal.meal_type}
              </span>
              <span className="text-sm text-white/70">
                {format(new Date(selectedMeal.eaten_at), "M월 d일 HH:mm", { locale: ko })}
              </span>
            </div>
            <p className="text-2xl font-bold">
              {selectedMeal.total_carbs}g 탄수화물
              {selectedMeal.total_calories ? ` · ${selectedMeal.total_calories}kcal` : ""}
            </p>
            {selectedMeal.note && (
              <p className="text-sm text-white/70 mt-1 line-clamp-3">
                {selectedMeal.note.replace(/^\[AI\] /, "")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
