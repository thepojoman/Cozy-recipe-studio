"use client";

import { useRouter } from "next/navigation";
import { ClipboardPaste, Wand2 } from "lucide-react";
import { useState } from "react";
import { RecipeForm } from "@/components/recipe-form";
import { parseRecipeText } from "@/lib/parser";
import { createRecipe } from "@/lib/recipe-repository";
import type { RecipeDraft } from "@/lib/types";

const sampleText = `Lemon Herb Skillet Chicken
Servings: 4
Prep time: 15 minutes
Cook time: 25 minutes

Ingredients
1 1/2 lb chicken thighs
2 tbsp olive oil
1 cup chicken stock
1 lemon, sliced
2 cloves garlic

Instructions
1. Sear chicken in a cast iron skillet for 6 minutes per side.
2. Simmer with stock and lemon for 12 minutes.
3. Rest for 5 minutes before serving.`;

export default function PasteRecipePage() {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [draft, setDraft] = useState<RecipeDraft | null>(null);
  const [error, setError] = useState("");
  const [parsing, setParsing] = useState(false);

  async function handleParse() {
    setError("");

    if (!rawText.trim()) {
      setError("Paste recipe text before parsing.");
      return;
    }

    setParsing(true);
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    setDraft(parseRecipeText(rawText));
    setParsing(false);
  }

  async function handleSave(recipeDraft: RecipeDraft) {
    const recipe = await createRecipe(recipeDraft);
    router.push(`/recipes/${recipe.id}`);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h1 className="recipe-title">Paste Recipe</h1>
        <div className="surface space-y-4 p-4 sm:p-6">
          <label className="block text-sm font-semibold text-cocoa">
            Raw recipe text
            <textarea
              className="soft-input mt-2 min-h-72"
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder={sampleText}
            />
          </label>
          {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="primary-button" onClick={handleParse} disabled={parsing}>
              <Wand2 size={18} aria-hidden />
              {parsing ? "Parsing..." : "Parse recipe"}
            </button>
            <button type="button" className="secondary-button" onClick={() => setRawText(sampleText)}>
              <ClipboardPaste size={18} aria-hidden />
              Try sample
            </button>
          </div>
        </div>
      </section>

      {draft && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-bark">Parsed draft</h2>
          <RecipeForm key={`${draft.title}-${draft.ingredients.length}`} initialDraft={draft} onSave={handleSave} saveLabel="Save parsed recipe" />
        </section>
      )}
    </div>
  );
}
