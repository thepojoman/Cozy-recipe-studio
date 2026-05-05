"use client";

import Link from "next/link";
import { ArrowLeft, Check, ChefHat, Clock, Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { ManualTimer, TimerButton } from "@/components/timer-button";
import { loadRecipe } from "@/lib/recipe-repository";
import { displayIngredient, scaleIngredient } from "@/lib/scaling";
import type { Recipe } from "@/lib/types";

export function CookingModeClient({ id }: { id: string }) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [scaleMode, setScaleMode] = useState("1");
  const [customScale, setCustomScale] = useState(1.5);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;

    async function load() {
      const foundRecipe = await loadRecipe(id);
      if (!active) return;
      setRecipe(foundRecipe);
      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, [id]);

  const scale = scaleMode === "custom" ? customScale : Number(scaleMode);
  const scaledIngredients = useMemo(() => {
    return recipe?.ingredients.map((ingredient) => scaleIngredient(ingredient, scale)) ?? [];
  }, [recipe, scale]);

  function toggle(itemId: string) {
    setChecked((current) => ({ ...current, [itemId]: !current[itemId] }));
  }

  if (loading) {
    return <div className="surface flex min-h-80 items-center justify-center p-8 text-lg font-semibold">Setting the counter...</div>;
  }

  if (!recipe) {
    return <EmptyState title="Recipe not found." actionHref="/" actionLabel="Back to library" />;
  }

  return (
    <div className="space-y-5">
      <section className="sticky top-16 z-20 -mx-4 border-b border-tan/40 bg-cream/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Link href={`/recipes/${recipe.id}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-cocoa">
              <ArrowLeft size={18} aria-hidden />
              Back
            </Link>
            <h1 className="recipe-title">{recipe.title}</h1>
          </div>
          <div className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-end">
            <label className="block text-sm font-semibold text-cocoa">
              Servings
              <select className="soft-input mt-2" value={scaleMode} onChange={(event) => setScaleMode(event.target.value)}>
                <option value="1">1x</option>
                <option value="2">2x</option>
                <option value="3">3x</option>
                <option value="4">4x</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            {scaleMode === "custom" ? (
              <div className="flex items-center gap-2">
                <button type="button" className="icon-button" onClick={() => setCustomScale((value) => Math.max(0.25, value - 0.25))}>
                  <Minus size={17} aria-hidden />
                </button>
                <input
                  className="soft-input w-24"
                  min={0.25}
                  step={0.25}
                  type="number"
                  value={customScale}
                  onChange={(event) => setCustomScale(Math.max(0.25, Number(event.target.value)))}
                  aria-label="Custom scale"
                />
                <button type="button" className="icon-button" onClick={() => setCustomScale((value) => value + 0.25)}>
                  <Plus size={17} aria-hidden />
                </button>
              </div>
            ) : (
              <div className="surface flex min-h-11 items-center px-4 text-sm font-semibold text-cocoa">
                Makes {recipe.servings * scale} servings
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <CookStat label="Prep" value={`${recipe.estimatedPrepTimeMinutes} min`} />
        <CookStat label="Cook" value={`${recipe.estimatedCookTimeMinutes} min`} />
        <CookStat label="Total" value={`${recipe.estimatedTotalTimeMinutes} min`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Checklist title="Ingredients">
            {scaledIngredients.map((ingredient) => (
              <CheckRow
                key={ingredient.id}
                id={`ingredient-${ingredient.id}`}
                checked={Boolean(checked[`ingredient-${ingredient.id}`])}
                onToggle={toggle}
              >
                {displayIngredient(ingredient)}
              </CheckRow>
            ))}
          </Checklist>

          <Checklist title="Instructions">
            {recipe.instructions.map((instruction) => (
              <div key={instruction.id} className="rounded-lg bg-cream p-3">
                <CheckRow
                  id={`instruction-${instruction.id}`}
                  checked={Boolean(checked[`instruction-${instruction.id}`])}
                  onToggle={toggle}
                >
                  <span className="font-bold text-forest">Step {instruction.stepNumber}</span> {instruction.text}
                </CheckRow>
                {instruction.hasTimer && instruction.timerSeconds && (
                  <div className="ml-12 mt-3">
                    <TimerButton seconds={instruction.timerSeconds} label={`step ${instruction.stepNumber}`} />
                  </div>
                )}
              </div>
            ))}
          </Checklist>
        </div>

        <div className="space-y-4">
          <Checklist title="Equipment">
            {recipe.equipment.length > 0 ? (
              recipe.equipment.map((item) => (
                <CheckRow
                  key={item.id}
                  id={`equipment-${item.id}`}
                  checked={Boolean(checked[`equipment-${item.id}`])}
                  onToggle={toggle}
                >
                  {item.name}
                </CheckRow>
              ))
            ) : (
              <p className="rounded-lg bg-cream p-3 text-sm font-semibold text-cocoa/70">No equipment saved.</p>
            )}
          </Checklist>
          <ManualTimer />
        </div>
      </section>
    </div>
  );
}

function CookStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface flex min-h-20 items-center gap-3 p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-lilac text-plum">
        <Clock size={20} aria-hidden />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase text-forest">{label}</p>
        <p className="text-xl font-bold text-bark">{value}</p>
      </div>
    </div>
  );
}

function Checklist({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface space-y-3 p-4 sm:p-6">
      <h2 className="flex items-center gap-2 text-xl font-semibold text-bark">
        <ChefHat size={20} aria-hidden />
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function CheckRow({
  id,
  checked,
  onToggle,
  children
}: {
  id: string;
  checked: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-start gap-3 rounded-lg bg-cream p-3 text-sm font-semibold text-cocoa">
      <span
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
          checked ? "border-forest bg-forest text-cream" : "border-tan bg-ivory"
        }`}
      >
        {checked && <Check size={16} aria-hidden />}
      </span>
      <input className="sr-only" type="checkbox" checked={checked} onChange={() => onToggle(id)} />
      <span className={checked ? "text-cocoa/55 line-through" : ""}>{children}</span>
    </label>
  );
}
