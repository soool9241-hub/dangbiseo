"use client";

import { useMemo, useState, useCallback } from "react";
import { Search, Star, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { foodDatabase, foodCategories } from "@/data/foods";
import type { Food, FoodCategory } from "@/types/database";

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useState(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  });

  // Simple implementation: update on each render cycle with delay
  if (debouncedValue !== value) {
    const id = setTimeout(() => setDebouncedValue(value), delay);
    // Cleanup on next call - this is a simplified approach for client components
    return value; // For responsiveness, return current value while debounce settles
  }

  return debouncedValue;
}

export default function FoodsPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FoodCategory | "전체">("전체");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const debouncedQuery = query.trim().toLowerCase();

  const filteredFoods = useMemo(() => {
    let foods = foodDatabase;

    if (activeCategory !== "전체") {
      foods = foods.filter((f) => f.category === activeCategory);
    }

    if (debouncedQuery) {
      foods = foods.filter(
        (f) =>
          f.name.toLowerCase().includes(debouncedQuery) ||
          f.category.includes(debouncedQuery)
      );
    }

    return foods;
  }, [activeCategory, debouncedQuery]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="space-y-4 py-6">
      <h1 className="text-2xl font-bold">음식 데이터베이스</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="음식 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {foodCategories.map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={activeCategory === cat ? "default" : "outline"}
            onClick={() => setActiveCategory(cat)}
            className="shrink-0 text-xs"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {filteredFoods.length}개 음식
      </p>

      {/* Food list */}
      <div className="space-y-2">
        {filteredFoods.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            검색 결과가 없습니다
          </p>
        ) : (
          filteredFoods.map((food) => {
            const isExpanded = expandedId === food.id;
            const isFav = favorites.has(food.id);

            return (
              <Card key={food.id}>
                <CardContent className="py-3">
                  <button
                    className="flex w-full items-center gap-3 text-left"
                    onClick={() => toggleExpand(food.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{food.name}</span>
                        <Badge variant="secondary" className="shrink-0 text-[10px]">{food.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{food.serving_size}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{food.carbs}g</p>
                      <p className="text-[10px] text-muted-foreground">탄수화물</p>
                    </div>
                    <div className="text-right shrink-0 min-w-12">
                      <p className="text-sm font-medium">{food.calories ?? "-"}</p>
                      <p className="text-[10px] text-muted-foreground">kcal</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded && (
                    <>
                      <Separator className="my-3" />
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg bg-muted/50 p-2">
                            <p className="text-xs text-muted-foreground">탄수화물</p>
                            <p className="font-bold text-blue-600 dark:text-blue-400">{food.carbs}g</p>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-2">
                            <p className="text-xs text-muted-foreground">단백질</p>
                            <p className="font-bold">{food.protein ?? "-"}g</p>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-2">
                            <p className="text-xs text-muted-foreground">지방</p>
                            <p className="font-bold">{food.fat ?? "-"}g</p>
                          </div>
                        </div>

                        {food.glycemic_note && (
                          <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950/30">
                            <p className="text-xs text-amber-700 dark:text-amber-400">{food.glycemic_note}</p>
                          </div>
                        )}

                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(food.id);
                            }}
                            className="gap-1"
                          >
                            <Star
                              className={`size-4 ${isFav ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                            />
                            {isFav ? "즐겨찾기 해제" : "즐겨찾기"}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
