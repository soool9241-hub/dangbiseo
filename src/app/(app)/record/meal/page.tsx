"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Camera, ImagePlus, Loader2, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSync } from "@/components/shared/SupabaseSyncProvider";
import { foodDatabase, foodCategories } from "@/data/foods";
import type { MealType, MealFoodItem, FoodCategory } from "@/types/database";
import { cn } from "@/lib/utils";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

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

interface AnalyzedFood {
  name: string;
  serving_size: string;
  carbs: number;
  protein: number | null;
  fat: number | null;
  calories: number | null;
}

export default function MealRecordPage() {
  const router = useRouter();
  const { addMealRecord } = useSync();
  const { user } = useAuth();

  const [mealType, setMealType] = useState<MealType>("lunch");
  const [mode, setMode] = useState<"photo" | "quick" | "detail">("photo");
  const [quickCarbs, setQuickCarbs] = useState(0);
  const [customCarbInput, setCustomCarbInput] = useState("");
  const [note, setNote] = useState("");
  const [recordTime, setRecordTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  // Detail mode
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | "전체">("전체");
  const [addedItems, setAddedItems] = useState<MealFoodItem[]>([]);

  // Photo mode
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState<string>("image/jpeg");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedFoods, setAnalyzedFoods] = useState<AnalyzedFood[]>([]);
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const [photoTotalCarbs, setPhotoTotalCarbs] = useState(0);
  const [photoTotalCalories, setPhotoTotalCalories] = useState(0);

  // Edit mode for analyzed foods
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<AnalyzedFood | null>(null);

  const filteredFoods = useMemo(() => {
    let list = foodDatabase;
    if (selectedCategory !== "전체") {
      list = list.filter((f) => f.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }
    return list.slice(0, 50);
  }, [searchQuery, selectedCategory]);

  const detailTotalCarbs = addedItems.reduce(
    (sum, item) => sum + item.carbs,
    0
  );
  const totalCarbs =
    mode === "quick"
      ? quickCarbs
      : mode === "detail"
      ? detailTotalCarbs
      : photoTotalCarbs;

  const totalCalories = mode === "photo" ? photoTotalCalories : null;

  // Recalculate totals when analyzedFoods change
  const recalcTotals = useCallback((foods: AnalyzedFood[]) => {
    setPhotoTotalCarbs(foods.reduce((s, f) => s + f.carbs, 0));
    setPhotoTotalCalories(foods.reduce((s, f) => s + (f.calories || 0), 0));
  }, []);

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

  const handleRemoveAnalyzedFood = (index: number) => {
    setAnalyzedFoods((prev) => {
      const next = prev.filter((_, i) => i !== index);
      recalcTotals(next);
      return next;
    });
  };

  // Edit analyzed food
  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...analyzedFoods[index] });
  };

  const saveEditing = () => {
    if (editingIndex === null || !editForm) return;
    setAnalyzedFoods((prev) => {
      const next = [...prev];
      next[editingIndex] = editForm;
      recalcTotals(next);
      return next;
    });
    setEditingIndex(null);
    setEditForm(null);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditForm(null);
  };

  const handlePhotoSelect = useCallback(async (file: File) => {
    setPhotoFile(file);
    setPhotoMimeType(file.type || "image/jpeg");

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Reset analyzed state
    setAnalyzedFoods([]);
    setAiDescription(null);
    setPhotoTotalCarbs(0);
    setPhotoTotalCalories(0);
    setEditingIndex(null);
    setEditForm(null);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoSelect(file);
    e.target.value = "";
  };

  const handleAnalyze = useCallback(async (base64: string, mime: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/meal/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType: mime }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "분석 실패");
      }

      const data = await res.json();

      if (data.foods && Array.isArray(data.foods)) {
        setAnalyzedFoods(data.foods);
        setPhotoTotalCarbs(data.total_carbs || data.foods.reduce((s: number, f: AnalyzedFood) => s + f.carbs, 0));
        setPhotoTotalCalories(data.total_calories || data.foods.reduce((s: number, f: AnalyzedFood) => s + (f.calories || 0), 0));
      }

      if (data.meal_type && mealTypes.some((mt) => mt.value === data.meal_type)) {
        setMealType(data.meal_type);
      }

      if (data.description) {
        setAiDescription(data.description);
      }

      toast.success("음식 분석 완료!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "분석에 실패했습니다");
    } finally {
      setAnalyzing(false);
    }
  }, []);

  // Auto-analyze when photo is selected
  useEffect(() => {
    if (photoBase64 && analyzedFoods.length === 0 && !analyzing) {
      handleAnalyze(photoBase64, photoMimeType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoBase64]);

  const uploadPhotoToStorage = async (): Promise<string | null> => {
    if (!photoFile || !user || !isSupabaseConfigured()) return null;

    try {
      const supabase = createClient();
      const now = new Date();
      const dateFolder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;
      const ext = photoFile.name.split(".").pop() || "jpg";
      const fileName = `${user.id}/${dateFolder}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("meal-photos")
        .upload(fileName, photoFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Photo upload error:", error);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from("meal-photos")
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (err) {
      console.error("Photo upload failed:", err);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (totalCarbs <= 0 && mode !== "photo") {
      toast.error("탄수화물량을 입력해 주세요");
      return;
    }

    if (mode === "photo" && analyzedFoods.length === 0) {
      toast.error("먼저 사진을 분석해 주세요");
      return;
    }

    // Upload photo to Supabase Storage
    let photoUrl: string | null = null;
    if (photoFile) {
      toast.loading("사진 저장 중...", { id: "photo-upload" });
      photoUrl = await uploadPhotoToStorage();
      toast.dismiss("photo-upload");
    }

    const items: MealFoodItem[] =
      mode === "photo"
        ? analyzedFoods.map((f, i) => ({
            id: `item-${Date.now()}-${i}`,
            meal_id: "",
            food_id: null,
            user_food_id: null,
            food_name: `${f.name} (${f.serving_size})`,
            quantity: 1,
            carbs: f.carbs,
          }))
        : mode === "quick"
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

    const noteText = [
      aiDescription ? `[AI] ${aiDescription}` : null,
      analyzedFoods.length > 0 ? analyzedFoods.map((f) => `${f.name} ${f.serving_size} (${f.carbs}g)`).join(", ") : null,
      note.trim() || null,
    ]
      .filter(Boolean)
      .join("\n");

    addMealRecord({
      meal_type: mealType,
      eaten_at: new Date(recordTime).toISOString(),
      total_carbs: totalCarbs,
      total_calories: totalCalories,
      photo_url: photoUrl,
      note: noteText || null,
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
          onClick={() => setMode("photo")}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5",
            mode === "photo"
              ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Camera className="size-3.5" />
          사진 분석
        </button>
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
        {totalCalories != null && totalCalories > 0 && (
          <span className="text-sm text-muted-foreground ml-2">
            ({totalCalories} kcal)
          </span>
        )}
      </div>

      {mode === "photo" ? (
        <>
          {/* Photo upload area */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {!photoPreview ? (
            <div className="flex gap-3 mb-5">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 flex flex-col items-center gap-3 py-8 rounded-2xl border-2 border-dashed border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/40 transition-colors"
              >
                <Camera className="size-10 text-orange-500" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  카메라 촬영
                </span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex flex-col items-center gap-3 py-8 rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/50 hover:bg-muted transition-colors"
              >
                <ImagePlus className="size-10 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  앨범에서 선택
                </span>
              </button>
            </div>
          ) : (
            <div className="mb-5">
              {/* Photo preview */}
              <div className="relative rounded-2xl overflow-hidden mb-3">
                <img
                  src={photoPreview}
                  alt="식사 사진"
                  className="w-full max-h-64 object-cover"
                />
                {analyzing && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="size-8 text-white animate-spin" />
                    <span className="text-white text-sm font-medium">AI 분석 중...</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    setPhotoPreview(null);
                    setPhotoFile(null);
                    setPhotoBase64(null);
                    setAnalyzedFoods([]);
                    setAiDescription(null);
                    setPhotoTotalCarbs(0);
                    setPhotoTotalCalories(0);
                    setEditingIndex(null);
                    setEditForm(null);
                  }}
                  className="absolute top-2 right-2 size-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* AI Description */}
              {aiDescription && (
                <div className="px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-sm text-orange-800 dark:text-orange-200 mb-3">
                  {aiDescription}
                </div>
              )}

              {/* Analyzed foods list - editable */}
              {analyzedFoods.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">
                      분석된 음식
                    </label>
                    <span className="text-xs text-muted-foreground">
                      탭하여 수정 가능
                    </span>
                  </div>
                  {analyzedFoods.map((food, i) =>
                    editingIndex === i && editForm ? (
                      // Edit mode
                      <div key={i} className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="text-sm h-8"
                            placeholder="음식 이름"
                          />
                          <Input
                            value={editForm.serving_size}
                            onChange={(e) => setEditForm({ ...editForm, serving_size: e.target.value })}
                            className="text-sm h-8 w-28"
                            placeholder="양"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-[10px] text-muted-foreground">탄수화물(g)</label>
                            <Input
                              type="number"
                              value={editForm.carbs}
                              onChange={(e) => setEditForm({ ...editForm, carbs: Number(e.target.value) || 0 })}
                              className="text-sm h-8"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] text-muted-foreground">칼로리</label>
                            <Input
                              type="number"
                              value={editForm.calories || ""}
                              onChange={(e) => setEditForm({ ...editForm, calories: Number(e.target.value) || null })}
                              className="text-sm h-8"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] text-muted-foreground">단백질(g)</label>
                            <Input
                              type="number"
                              value={editForm.protein || ""}
                              onChange={(e) => setEditForm({ ...editForm, protein: Number(e.target.value) || null })}
                              className="text-sm h-8"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] text-muted-foreground">지방(g)</label>
                            <Input
                              type="number"
                              value={editForm.fat || ""}
                              onChange={(e) => setEditForm({ ...editForm, fat: Number(e.target.value) || null })}
                              className="text-sm h-8"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-7 text-xs">
                            취소
                          </Button>
                          <Button size="sm" onClick={saveEditing} className="h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white">
                            <Check className="size-3 mr-1" />
                            저장
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Display mode
                      <div
                        key={i}
                        className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer transition-colors"
                        onClick={() => startEditing(i)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium">{food.name}</span>
                            <Pencil className="size-3 text-muted-foreground" />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {food.serving_size}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                              {food.carbs}g
                            </span>
                            {food.calories != null && (
                              <span className="text-xs text-muted-foreground ml-1">
                                {food.calories}kcal
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveAnalyzedFood(i);
                            }}
                            className="size-6 rounded-full hover:bg-destructive/10 flex items-center justify-center"
                          >
                            <X className="size-3.5 text-destructive" />
                          </button>
                        </div>
                      </div>
                    )
                  )}

                  {/* Re-take or add from album */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cameraInputRef.current?.click()}
                      className="text-xs"
                    >
                      <Camera className="size-3 mr-1" />
                      다시 촬영
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs"
                    >
                      <ImagePlus className="size-3 mr-1" />
                      다른 사진
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (photoBase64) handleAnalyze(photoBase64, photoMimeType);
                      }}
                      disabled={analyzing}
                      className="text-xs"
                    >
                      <Loader2 className={cn("size-3 mr-1", analyzing && "animate-spin")} />
                      재분석
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : mode === "quick" ? (
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

            {/* Category filter */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-hide">
              {foodCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    selectedCategory === cat
                      ? "bg-orange-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1">
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

      {/* Date/Time */}
      <div className="mb-4">
        <label className="text-sm font-medium text-muted-foreground block mb-1">식사 시간</label>
        <input
          type="datetime-local"
          value={recordTime}
          onChange={(e) => setRecordTime(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border bg-background text-sm"
        />
      </div>

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
        disabled={
          (mode === "photo" && analyzedFoods.length === 0) ||
          (mode !== "photo" && totalCarbs <= 0)
        }
        className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold rounded-xl mt-auto"
      >
        기록하기
      </Button>
    </div>
  );
}
