"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRecordsStore } from "@/stores/records-store";
import { foodDatabase } from "@/data/foods";
import type { MealType, MealFoodItem } from "@/types/database";
import { cn } from "@/lib/utils";

const mealTypes: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "아침" },
  { value: "lunch", label: "점심" },
  { value: "dinner", label: "저녁" },
  { value: "snack", label: "간식" },
];

const carbPresets = [
  { label: "밥1공기", carbs: 65 },
  { label: "밥반공기", carbs: 33 },
  { label: "빵1개", carbs: 30 },
  { label: "햄버거", carbs: 50 },
  { label: "라면", carbs: 65 },
  { label: "떡볶이", carbs: 80 },
  { label: "삼각김밥", carbs: 35 },
  { label: "과일", carbs: 15 },
  { label: "음료수", carbs: 30 },
];

export default function MealRecordPage() {
  const router = useRouter();
  const addMealRecord = useRecordsStore((s) => s.addMealRecord);

  const [mealType, setMealType] = useState<MealType>("lunch");
  const [mode, setMode] = useState<"quick" | "detail">("quick");
  const [quickCarbs, setQuickCarbs] = useState(0);
  const [customCarbInput, setCustomCarbInput] = useState("");
  const [note, setNote] = useState("");

  // Detail mode
  const [searchQuery, setSearchQuery] = useState("");
  const [addedItems, setAddedItems] = useState<MealFoodItem[]>([]);

  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return foodDatabase.slice(0, 12);
    const q = searchQuery.trim().toLowerCase();
    return foodDatabase.filter((f) =>
      f.name.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const detailTotalCarbs = addedItems.reduce(
    (sum, item) => sum + item.carbs,
    0
  );
  const totalCarbs = mode === "quick" ? quickCarbs : detailTotalCarbs;

  const handlePresetClick = (carbs: number) => {
    setQuickCarbs((prev) => prev + carbs);
  };

  const handleCustomAdd = () => {
    const val = parseInt(customCarbInput, 10);
    if (!isNaN(val) && val > 0) {
      setQuickCarbs((prev) => prev + val);
      setCustomCarbInput("");
    }
  };

  const handleAddFood = (food: (typeof foodDatabase)[0]) => {
    const item: MealFoodItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      meal_id: "",
      food_id: food.id,
      user_food_id: null,
      food_name: food.name,
      quantity: 1,
      carbs: food.carbs,
    };
    setAddedItems((prev) => [...prev, item]);
  };

  const handleRemoveItem = (id: string) => {
    setAddedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = () => {
    if (totalCarbs <= 0) {
      toast.error("탄수화물량을 입력해 주세요");
      return;
    }

    const items: MealFoodItem[] =
      mode === "quick"
        ? [
            {
              id: `item-${Date.now()}`,
              meal_id: "",
              food_id: null,
              user_food_id: null,
              food_name: "빠른 입력",
              quantity: 1,
              carbs: quickCarbs,
            },
          ]
        : addedItems;

    addMealRecord({
      meal_type: mealType,
      eaten_at: new Date().toISOString(),
      total_carbs: totalCarbs,
      total_calories: null,
      photo_url: null,
      note: note.trim() || null,
      items,
    });
    toast.success("식단이 기록되었습니다");
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
        <h1 className="text-xl font-bold">식단 기록</h1>
      </div>

      {/* Meal type */}
      <div className="flex gap-2 mb-5">
        {mealTypes.map((mt) => (
          <button
            key={mt.value}
            onClick={() => setMealType(mt.value)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors",
              mealType === mt.value
                ? "bg-orange-500 text-white"
                : "bg-muted text-muted-foreground"
            )}
          >
            {mt.label}
          </button>
        ))}
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setMode("quick")}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
            mode === "quick"
              ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
              : "bg-muted text-muted-foreground"
          )}
        >
          빠른 입력
        </button>
        <button
          onClick={() => setMode("detail")}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
            mode === "detail"
              ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
              : "bg-muted text-muted-foreground"
          )}
        >
          상세 입력
        </button>
      </div>

      {/* Total carbs display */}
      <div className="text-center mb-5">
        <div className="text-4xl font-bold tabular-nums">{totalCarbs}g</div>
        <span className="text-sm text-muted-foreground">총 탄수화물</span>
      </div>

      {mode === "quick" ? (
        <>
          {/* Carb presets grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {carbPresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset.carbs)}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-muted hover:bg-muted/80 active:scale-95 transition-all"
              >
                <span className="text-sm font-medium">{preset.label}</span>
                <span className="text-xs text-muted-foreground">
                  {preset.carbs}g
                </span>
              </button>
            ))}
            {/* Custom input */}
            <div className="flex flex-col items-center gap-1 py-2 px-2 rounded-xl bg-muted">
              <span className="text-xs font-medium text-muted-foreground">
                직접입력
              </span>
              <div className="flex gap-1 items-center">
                <Input
                  type="number"
                  value={customCarbInput}
                  onChange={(e) => setCustomCarbInput(e.target.value)}
                  className="h-7 w-14 text-center text-sm px-1"
                  placeholder="g"
                />
                <button
                  onClick={handleCustomAdd}
                  className="size-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>
          </div>

          {quickCarbs > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickCarbs(0)}
              className="text-xs text-muted-foreground mb-4"
            >
              초기화
            </Button>
          )}
        </>
      ) : (
        <>
          {/* Food search */}
          <div className="mb-4">
            <Input
              placeholder="음식 이름 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-3"
            />

            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredFoods.map((food) => (
                <button
                  key={food.id}
                  onClick={() => handleAddFood(food)}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div>
                    <span className="text-sm font-medium">{food.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {food.serving_size}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    {food.carbs}g
                  </span>
                </button>
              ))}
              {filteredFoods.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  검색 결과가 없습니다
                </p>
              )}
            </div>
          </div>

          {/* Added items */}
          {addedItems.length > 0 && (
            <div className="space-y-1 mb-4">
              <label className="text-sm font-medium text-muted-foreground">
                추가된 음식
              </label>
              {addedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted"
                >
                  <span className="text-sm">{item.food_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {item.carbs}g
                    </span>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="size-6 rounded-full hover:bg-destructive/10 flex items-center justify-center"
                    >
                      <X className="size-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Note */}
      <Textarea
        placeholder="메모 (선택)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="mb-4 resize-none"
        rows={2}
      />

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={totalCarbs <= 0}
        className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold rounded-xl mt-auto"
      >
        기록하기
      </Button>
    </div>
  );
}
