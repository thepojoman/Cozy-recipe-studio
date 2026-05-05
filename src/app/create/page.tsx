"use client";

import { useRouter } from "next/navigation";
import { RecipeForm } from "@/components/recipe-form";
import { createRecipe } from "@/lib/recipe-repository";
import type { RecipeDraft } from "@/lib/types";

export default function CreateRecipePage() {
  const router = useRouter();

  async function handleSave(draft: RecipeDraft) {
    const recipe = await createRecipe(draft);
    router.push(`/recipes/${recipe.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="recipe-title">Create Recipe</h1>
      </div>
      <RecipeForm onSave={handleSave} />
    </div>
  );
}
