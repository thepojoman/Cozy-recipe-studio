"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { RecipeForm } from "@/components/recipe-form";
import { draftToRecipe, loadRecipe, updateFullRecipe } from "@/lib/recipe-repository";
import type { Recipe, RecipeDraft } from "@/lib/types";

export function RecipeEditClient({ id }: { id: string }) {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

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

  async function handleSave(draft: RecipeDraft) {
    if (!recipe) return;
    const updated = await updateFullRecipe(draftToRecipe(draft, recipe));
    router.push(`/recipes/${updated.id}`);
  }

  if (loading) {
    return <div className="surface flex min-h-80 items-center justify-center p-8 text-lg font-semibold">Opening editor...</div>;
  }

  if (!recipe) {
    return <EmptyState title="Recipe not found." actionHref="/" actionLabel="Back to library" />;
  }

  const { createdAt, ...draft } = recipe;

  return (
    <div className="space-y-6">
      <h1 className="recipe-title">Edit Recipe</h1>
      <RecipeForm initialDraft={draft} onSave={handleSave} saveLabel="Save changes" />
    </div>
  );
}
