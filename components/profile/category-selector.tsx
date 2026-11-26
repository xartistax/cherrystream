"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type CategorySelectorProps = {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  initialCategoryIds: string[];
  maxSelections?: number;
};

export function CategorySelector({ categories, initialCategoryIds, maxSelections = 5 }: CategorySelectorProps) {
  const [selectedIds, setSelectedIds] = useState(new Set(initialCategoryIds));

  function toggleCategory(categoryId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(categoryId)) {
        next.delete(categoryId);
        return next;
      }

      if (next.size >= maxSelections) {
        return current;
      }

      next.add(categoryId);

      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-white">Rubriken</p>

          <p className="mt-1 text-sm text-zinc-500">Wähle bis zu {maxSelections} passende Rubriken.</p>
        </div>

        <span className="text-sm text-zinc-500">
          {selectedIds.size}/{maxSelections}
        </span>
      </div>

      {Array.from(selectedIds).map((categoryId) => (
        <input key={categoryId} type="hidden" name="categoryIds" value={categoryId} />
      ))}

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const selected = selectedIds.has(category.id);
          const disabled = !selected && selectedIds.size >= maxSelections;

          return (
            <button
              key={category.id}
              type="button"
              disabled={disabled}
              onClick={() => toggleCategory(category.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition",
                selected
                  ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                  : "border-white/10 bg-white/3 text-zinc-400 hover:bg-white/[0.07] hover:text-white",
                disabled && "cursor-not-allowed opacity-40",
              )}
            >
              {selected ? <Check className="size-3.5" /> : null}
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
