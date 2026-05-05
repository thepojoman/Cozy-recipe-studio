"use client";

import { Check, ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { suggestedTags } from "@/lib/constants";
import { createId } from "@/lib/id";
import { detectTimerSeconds } from "@/lib/parser";
import { fileToDataUrl, listCustomTags } from "@/lib/recipe-store";
import { formatQuantity, parseQuantity } from "@/lib/scaling";
import type { Equipment, Ingredient, Instruction, RecipeDraft, RecipePhoto } from "@/lib/types";

function blankIngredient(): Ingredient {
  return {
    id: createId("ingredient"),
    name: "",
    quantity: null,
    unit: "",
    originalText: "",
    scalable: true
  };
}

function blankInstruction(stepNumber: number): Instruction {
  return {
    id: createId("instruction"),
    stepNumber,
    text: "",
    hasTimer: false,
    timerSeconds: null
  };
}

function blankEquipment(): Equipment {
  return {
    id: createId("equipment"),
    name: "",
    notes: ""
  };
}

const defaultDraft: RecipeDraft = {
  title: "",
  description: "",
  servings: 4,
  estimatedPrepTimeMinutes: 10,
  estimatedCookTimeMinutes: 25,
  estimatedTotalTimeMinutes: 35,
  actualTotalTimeMinutes: null,
  actualTimeNotes: "",
  ingredients: [blankIngredient()],
  instructions: [blankInstruction(1)],
  equipment: [blankEquipment()],
  photos: [],
  tags: ["Cozy Dinner"]
};

export function RecipeForm({
  initialDraft,
  onSave,
  saveLabel = "Save recipe"
}: {
  initialDraft?: RecipeDraft;
  onSave: (draft: RecipeDraft) => void;
  saveLabel?: string;
}) {
  const [draft, setDraft] = useState<RecipeDraft>(() => ({
    ...defaultDraft,
    ...initialDraft,
    ingredients: initialDraft?.ingredients?.length ? initialDraft.ingredients : defaultDraft.ingredients,
    instructions: initialDraft?.instructions?.length ? initialDraft.instructions : defaultDraft.instructions,
    equipment: initialDraft?.equipment?.length ? initialDraft.equipment : defaultDraft.equipment,
    photos: initialDraft?.photos ?? [],
    tags: initialDraft?.tags?.length ? initialDraft.tags : defaultDraft.tags
  }));
  const [customTag, setCustomTag] = useState("");
  const [photoError, setPhotoError] = useState("");

  const availableTags = useMemo(() => {
    const tags = [...suggestedTags, ...listCustomTags(), ...draft.tags];
    return [...new Set(tags)].sort((a, b) => a.localeCompare(b));
  }, [draft.tags]);

  function updateField<K extends keyof RecipeDraft>(key: K, value: RecipeDraft[K]) {
    setDraft((current) => {
      const next = { ...current, [key]: value };

      if (key === "estimatedPrepTimeMinutes" || key === "estimatedCookTimeMinutes") {
        next.estimatedTotalTimeMinutes = Number(next.estimatedPrepTimeMinutes) + Number(next.estimatedCookTimeMinutes);
      }

      return next;
    });
  }

  function updateIngredient(id: string, patch: Partial<Ingredient>) {
    setDraft((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient) =>
        ingredient.id === id
          ? {
              ...ingredient,
              ...patch,
              originalText:
                patch.originalText ??
                [formatQuantity(patch.quantity ?? ingredient.quantity), patch.unit ?? ingredient.unit, patch.name ?? ingredient.name]
                  .filter(Boolean)
                  .join(" ")
            }
          : ingredient
      )
    }));
  }

  function updateInstruction(id: string, patch: Partial<Instruction>) {
    setDraft((current) => ({
      ...current,
      instructions: current.instructions.map((instruction) =>
        instruction.id === id ? { ...instruction, ...patch } : instruction
      )
    }));
  }

  function updateEquipment(id: string, patch: Partial<Equipment>) {
    setDraft((current) => ({
      ...current,
      equipment: current.equipment.map((item) => (item.id === id ? { ...item, ...patch } : item))
    }));
  }

  function removeFromList(list: "ingredients" | "instructions" | "equipment", id: string) {
    setDraft((current) => {
      if (list === "ingredients") {
        return {
          ...current,
          ingredients: current.ingredients.filter((ingredient) => ingredient.id !== id)
        };
      }

      if (list === "equipment") {
        return {
          ...current,
          equipment: current.equipment.filter((item) => item.id !== id)
        };
      }

      return {
        ...current,
        instructions: current.instructions
          .filter((instruction) => instruction.id !== id)
          .map((instruction, index) => ({ ...instruction, stepNumber: index + 1 }))
      };
    });
  }

  async function handlePhotoUpload(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    setPhotoError("");

    try {
      const photoUrls = await Promise.all([...files].map(fileToDataUrl));
      const photos: RecipePhoto[] = photoUrls.map((photoUrl, index) => ({
        id: createId("photo"),
        photoUrl,
        isCoverPhoto: draft.photos.length === 0 && index === 0,
        createdAt: new Date().toISOString()
      }));
      setDraft((current) => ({
        ...current,
        photos: [...current.photos, ...photos]
      }));
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "Could not upload photos.");
    }
  }

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanedInstructions = draft.instructions
      .filter((instruction) => instruction.text.trim())
      .map((instruction, index) => {
        const detectedTimerSeconds = instruction.timerSeconds ?? detectTimerSeconds(instruction.text);

        return {
          ...instruction,
          stepNumber: index + 1,
          hasTimer: instruction.hasTimer || detectedTimerSeconds !== null,
          timerSeconds: detectedTimerSeconds
        };
      });
    const cleanedIngredients = draft.ingredients.filter((ingredient) => ingredient.name.trim() || ingredient.originalText.trim());
    const cleanedEquipment = draft.equipment.filter((item) => item.name.trim());

    onSave({
      ...draft,
      title: draft.title.trim() || "Untitled Recipe",
      description: draft.description.trim(),
      servings: Number(draft.servings) || 1,
      estimatedPrepTimeMinutes: Number(draft.estimatedPrepTimeMinutes) || 0,
      estimatedCookTimeMinutes: Number(draft.estimatedCookTimeMinutes) || 0,
      estimatedTotalTimeMinutes:
        Number(draft.estimatedTotalTimeMinutes) ||
        Number(draft.estimatedPrepTimeMinutes) + Number(draft.estimatedCookTimeMinutes),
      ingredients: cleanedIngredients.length ? cleanedIngredients : [blankIngredient()],
      instructions: cleanedInstructions.length ? cleanedInstructions : [blankInstruction(1)],
      equipment: cleanedEquipment,
      tags: draft.tags.length ? draft.tags : ["Cozy Dinner"]
    });
  }

  return (
    <form onSubmit={submitForm} className="space-y-6">
      <section className="surface space-y-4 p-4 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-cocoa">
              Recipe title
              <input
                className="soft-input mt-2"
                value={draft.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="Lemon Herb Skillet Chicken"
              />
            </label>
            <label className="block text-sm font-semibold text-cocoa">
              Description
              <textarea
                className="soft-input mt-2 min-h-28"
                value={draft.description}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder="A short note about why this recipe earns a spot in the box."
              />
            </label>
          </div>
          <div className="space-y-3">
            <label className="secondary-button min-h-28 cursor-pointer flex-col">
              <ImagePlus size={22} aria-hidden />
              Add dish photos
              <input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => handlePhotoUpload(event.target.files)} />
            </label>
            {photoError && <p className="text-sm font-semibold text-red-700">{photoError}</p>}
            <div className="grid grid-cols-3 gap-2">
              {draft.photos.slice(0, 6).map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  className={`aspect-square overflow-hidden rounded-lg border ${
                    photo.isCoverPhoto ? "border-forest ring-2 ring-forest/30" : "border-tan/60"
                  }`}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      photos: current.photos.map((item) => ({ ...item, isCoverPhoto: item.id === photo.id }))
                    }))
                  }
                  aria-label="Set cover photo"
                >
                  <img src={photo.photoUrl} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <label className="surface block p-4 text-sm font-semibold text-cocoa">
          Servings
          <input
            className="soft-input mt-2"
            min={1}
            type="number"
            value={draft.servings}
            onChange={(event) => updateField("servings", Number(event.target.value))}
          />
        </label>
        <label className="surface block p-4 text-sm font-semibold text-cocoa">
          Prep
          <input
            className="soft-input mt-2"
            min={0}
            type="number"
            value={draft.estimatedPrepTimeMinutes}
            onChange={(event) => updateField("estimatedPrepTimeMinutes", Number(event.target.value))}
          />
        </label>
        <label className="surface block p-4 text-sm font-semibold text-cocoa">
          Cook
          <input
            className="soft-input mt-2"
            min={0}
            type="number"
            value={draft.estimatedCookTimeMinutes}
            onChange={(event) => updateField("estimatedCookTimeMinutes", Number(event.target.value))}
          />
        </label>
        <label className="surface block p-4 text-sm font-semibold text-cocoa">
          Total
          <input
            className="soft-input mt-2"
            min={0}
            type="number"
            value={draft.estimatedTotalTimeMinutes}
            onChange={(event) => updateField("estimatedTotalTimeMinutes", Number(event.target.value))}
          />
        </label>
      </section>

      <section className="surface space-y-4 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-bark">Ingredients</h2>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setDraft((current) => ({ ...current, ingredients: [...current.ingredients, blankIngredient()] }))}
          >
            <Plus size={17} aria-hidden />
            Add
          </button>
        </div>
        <div className="space-y-3">
          {draft.ingredients.map((ingredient) => (
            <div key={ingredient.id} className="grid gap-2 sm:grid-cols-[110px_110px_1fr_auto]">
              <input
                className="soft-input"
                value={formatQuantity(ingredient.quantity)}
                onChange={(event) => updateIngredient(ingredient.id, { quantity: parseQuantity(event.target.value) })}
                placeholder="1 1/2"
                aria-label="Ingredient quantity"
              />
              <input
                className="soft-input"
                value={ingredient.unit}
                onChange={(event) => updateIngredient(ingredient.id, { unit: event.target.value })}
                placeholder="cups"
                aria-label="Ingredient unit"
              />
              <input
                className="soft-input"
                value={ingredient.name}
                onChange={(event) => updateIngredient(ingredient.id, { name: event.target.value })}
                placeholder="jasmine rice"
                aria-label="Ingredient name"
              />
              <div className="flex gap-2">
                <label className="flex min-h-11 items-center gap-2 rounded-lg border border-tan/60 bg-cream px-3 text-sm font-semibold text-cocoa">
                  <input
                    type="checkbox"
                    checked={ingredient.scalable}
                    onChange={(event) => updateIngredient(ingredient.id, { scalable: event.target.checked })}
                  />
                  Scales
                </label>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => removeFromList("ingredients", ingredient.id)}
                  aria-label="Remove ingredient"
                >
                  <Trash2 size={17} aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="surface space-y-4 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-bark">Equipment</h2>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setDraft((current) => ({ ...current, equipment: [...current.equipment, blankEquipment()] }))}
          >
            <Plus size={17} aria-hidden />
            Add
          </button>
        </div>
        <div className="space-y-3">
          {draft.equipment.map((item) => (
            <div key={item.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                className="soft-input"
                value={item.name}
                onChange={(event) => updateEquipment(item.id, { name: event.target.value })}
                placeholder="Dutch oven"
                aria-label="Equipment name"
              />
              <input
                className="soft-input"
                value={item.notes ?? ""}
                onChange={(event) => updateEquipment(item.id, { notes: event.target.value })}
                placeholder="Optional note"
                aria-label="Equipment note"
              />
              <button
                type="button"
                className="icon-button"
                onClick={() => removeFromList("equipment", item.id)}
                aria-label="Remove equipment"
              >
                <Trash2 size={17} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="surface space-y-4 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-bark">Instructions</h2>
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              setDraft((current) => ({
                ...current,
                instructions: [...current.instructions, blankInstruction(current.instructions.length + 1)]
              }))
            }
          >
            <Plus size={17} aria-hidden />
            Add
          </button>
        </div>
        <div className="space-y-3">
          {draft.instructions.map((instruction, index) => (
            <div key={instruction.id} className="grid gap-2 sm:grid-cols-[48px_1fr_150px_auto]">
              <div className="flex min-h-11 items-center justify-center rounded-lg bg-sage text-sm font-bold text-bark">{index + 1}</div>
              <textarea
                className="soft-input min-h-24"
                value={instruction.text}
                onChange={(event) => updateInstruction(instruction.id, { text: event.target.value })}
                placeholder="Bake for 20 minutes, then rest for 10 minutes."
                aria-label={`Instruction ${index + 1}`}
              />
              <input
                className="soft-input"
                type="number"
                min={0}
                value={instruction.timerSeconds ? Math.round(instruction.timerSeconds / 60) : ""}
                onChange={(event) =>
                  updateInstruction(instruction.id, {
                    hasTimer: Number(event.target.value) > 0,
                    timerSeconds: Number(event.target.value) > 0 ? Number(event.target.value) * 60 : null
                  })
                }
                placeholder="Timer min"
                aria-label="Timer minutes"
              />
              <button
                type="button"
                className="icon-button"
                onClick={() => removeFromList("instructions", instruction.id)}
                aria-label="Remove instruction"
              >
                <Trash2 size={17} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="surface space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => {
            const active = draft.tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                className={`chip min-h-11 ${active ? "border-forest bg-sage text-bark" : ""}`}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    tags: active ? current.tags.filter((item) => item !== tag) : [...current.tags, tag]
                  }))
                }
              >
                {active && <Check size={15} aria-hidden />}
                {tag}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="soft-input"
            value={customTag}
            onChange={(event) => setCustomTag(event.target.value)}
            placeholder="Add a custom tag"
          />
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              const tag = customTag.trim();
              if (!tag) return;
              setDraft((current) => ({ ...current, tags: [...new Set([...current.tags, tag])] }));
              setCustomTag("");
            }}
          >
            <Plus size={17} aria-hidden />
            Add tag
          </button>
        </div>
      </section>

      <div className="sticky bottom-20 z-20 flex justify-end lg:bottom-4">
        <button type="submit" className="primary-button shadow-soft">
          <Save size={18} aria-hidden />
          {saveLabel}
        </button>
      </div>
    </form>
  );
}
