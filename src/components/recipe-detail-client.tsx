"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Check, Clock, Pencil, Play, Save, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { createId } from "@/lib/id";
import { loadRecipe, removeRecipe, updateFullRecipe } from "@/lib/recipe-repository";
import { fileToDataUrl } from "@/lib/recipe-store";
import { displayIngredient } from "@/lib/scaling";
import { hasSupabaseConfig, uploadRecipePhoto } from "@/lib/supabase";
import type { Recipe, RecipePhoto } from "@/lib/types";

export function RecipeDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [actualTime, setActualTime] = useState("");
  const [actualNotes, setActualNotes] = useState("");
  const [status, setStatus] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [prepChecked, setPrepChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;

    async function load() {
      const foundRecipe = await loadRecipe(id);
      if (!active) return;
      setRecipe(foundRecipe);
      setActualTime(foundRecipe?.actualTotalTimeMinutes ? String(foundRecipe.actualTotalTimeMinutes) : "");
      setActualNotes(foundRecipe?.actualTimeNotes ?? "");
      setPrepChecked(foundRecipe ? readPrepChecklist(foundRecipe.id) : {});
      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, [id]);

  async function persist(nextRecipe: Recipe) {
    const savedRecipe = await updateFullRecipe(nextRecipe);
    setRecipe(savedRecipe);
  }

  function saveActualTime() {
    if (!recipe) return;

    void persist({
      ...recipe,
      actualTotalTimeMinutes: actualTime ? Number(actualTime) : null,
      actualTimeNotes: actualNotes
    });
    setStatus("Actual time saved.");
    window.setTimeout(() => setStatus(""), 2200);
  }

  async function handlePhotoUpload(files: FileList | null) {
    if (!recipe || !files?.length) {
      return;
    }

    setUploadError("");
    const photos: RecipePhoto[] = [];

    for (const file of [...files]) {
      try {
        const photoUrl = hasSupabaseConfig ? await uploadRecipePhoto(file, recipe.id) : await fileToDataUrl(file);
        photos.push({
          id: createId("photo"),
          recipeId: recipe.id,
          photoUrl,
          isCoverPhoto: recipe.photos.length === 0 && photos.length === 0,
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "Photo upload failed.");
      }
    }

    if (photos.length > 0) {
      void persist({
        ...recipe,
        photos: [...recipe.photos, ...photos]
      });
    }
  }

  function setCoverPhoto(photoId: string) {
    if (!recipe) return;

    void persist({
      ...recipe,
      photos: recipe.photos.map((photo) => ({ ...photo, isCoverPhoto: photo.id === photoId }))
    });
  }

  async function handleDelete() {
    if (!recipe) return;

    const confirmed = window.confirm(`Delete ${recipe.title}?`);
    if (!confirmed) return;

    await removeRecipe(recipe.id);
    router.push("/");
  }

  function togglePrepCheck(itemId: string) {
    if (!recipe) return;

    setPrepChecked((current) => {
      const next = {
        ...current,
        [itemId]: !current[itemId]
      };
      window.localStorage.setItem(prepChecklistStorageKey(recipe.id), JSON.stringify(next));
      return next;
    });
  }

  if (loading) {
    return <div className="surface flex min-h-80 items-center justify-center p-8 text-lg font-semibold">Opening recipe...</div>;
  }

  if (!recipe) {
    return <EmptyState title="Recipe not found." actionHref="/" actionLabel="Back to library" />;
  }

  const cover = recipe.photos.find((photo) => photo.isCoverPhoto) ?? recipe.photos[0];

  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <h1 className="recipe-title">{recipe.title}</h1>
          <p className="max-w-3xl text-lg leading-8 text-cocoa/85">{recipe.description}</p>
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <span key={tag} className="chip">
                {tag}
              </span>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <TimeStat label="Prep" value={`${recipe.estimatedPrepTimeMinutes} min`} />
            <TimeStat label="Cook" value={`${recipe.estimatedCookTimeMinutes} min`} />
            <TimeStat label="Total" value={`${recipe.estimatedTotalTimeMinutes} min`} />
            <TimeStat label="Servings" value={String(recipe.servings)} />
          </div>
        </div>
        <div className="surface overflow-hidden">
          <div className="aspect-[4/3] bg-sage/50">
            {cover ? (
              <img src={cover.photoUrl} alt={recipe.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-forest">
                <Camera size={42} aria-hidden />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="surface space-y-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-bark">My actual time</h2>
            {status && <p className="text-sm font-semibold text-forest">{status}</p>}
          </div>
          <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto]">
            <label className="block text-sm font-semibold text-cocoa">
              Minutes
              <input
                className="soft-input mt-2"
                type="number"
                min={0}
                value={actualTime}
                onChange={(event) => setActualTime(event.target.value)}
                placeholder="42"
              />
            </label>
            <label className="block text-sm font-semibold text-cocoa">
              Notes
              <input
                className="soft-input mt-2"
                value={actualNotes}
                onChange={(event) => setActualNotes(event.target.value)}
                placeholder="What changed in your kitchen?"
              />
            </label>
            <button type="button" className="primary-button self-end" onClick={saveActualTime}>
              <Save size={18} aria-hidden />
              Save
            </button>
          </div>
        </div>

        <div className="surface flex flex-col gap-3 p-4 sm:p-6">
          <Link href={`/recipes/${recipe.id}/cook`} className="primary-button">
            <Play size={18} aria-hidden />
            Cooking mode
          </Link>
          <Link href={`/recipes/${recipe.id}/edit`} className="secondary-button">
            <Pencil size={18} aria-hidden />
            Edit recipe
          </Link>
          <button type="button" className="secondary-button text-red-800" onClick={handleDelete}>
            <Trash2 size={18} aria-hidden />
            Delete
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <PrepChecklist
          title="Ingredients"
          items={recipe.ingredients.map((ingredient) => ({
            id: `ingredient-${ingredient.id}`,
            label: displayIngredient(ingredient)
          }))}
          checked={prepChecked}
          onToggle={togglePrepCheck}
        />
        <PrepChecklist
          title="Special tools"
          items={recipe.equipment.map((item) => ({
            id: `equipment-${item.id}`,
            label: item.name,
            detail: item.notes
          }))}
          checked={prepChecked}
          onToggle={togglePrepCheck}
        />
        <RecipeList title="Instructions" items={recipe.instructions.map((instruction) => `${instruction.stepNumber}. ${instruction.text}`)} />
      </section>

      <section className="surface space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-bark">Dish photos</h2>
          <label className="secondary-button cursor-pointer">
            <Upload size={18} aria-hidden />
            Add photos
            <input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => handlePhotoUpload(event.target.files)} />
          </label>
        </div>
        {uploadError && <p className="text-sm font-semibold text-red-700">{uploadError}</p>}
        {recipe.photos.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recipe.photos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                className={`aspect-square overflow-hidden rounded-lg border ${
                  photo.isCoverPhoto ? "border-forest ring-2 ring-forest/30" : "border-tan/60"
                }`}
                onClick={() => setCoverPhoto(photo.id)}
                aria-label="Set as cover photo"
              >
                <img src={photo.photoUrl} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm font-semibold text-cocoa/70">No photos yet.</p>
        )}
      </section>
    </div>
  );
}

function prepChecklistStorageKey(recipeId: string) {
  return `cozy_recipe_detail_prep_${recipeId}`;
}

function readPrepChecklist(recipeId: string): Record<string, boolean> {
  try {
    const stored = window.localStorage.getItem(prepChecklistStorageKey(recipeId));
    return stored ? (JSON.parse(stored) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function TimeStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface flex min-h-20 flex-col justify-center p-4">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase text-forest">
        <Clock size={14} aria-hidden />
        {label}
      </span>
      <strong className="mt-1 text-xl text-bark">{value}</strong>
    </div>
  );
}

function RecipeList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="surface p-4 sm:p-6">
      <h2 className="mb-4 text-xl font-semibold text-bark">{title}</h2>
      <ul className="space-y-3">
        {items.length > 0 ? (
          items.map((item, index) => (
            <li key={`${item}-${index}`} className="rounded-lg bg-cream px-3 py-3 text-sm font-semibold text-cocoa">
              {item}
            </li>
          ))
        ) : (
          <li className="rounded-lg bg-cream px-3 py-3 text-sm font-semibold text-cocoa/70">Nothing saved.</li>
        )}
      </ul>
    </div>
  );
}

function PrepChecklist({
  title,
  items,
  checked,
  onToggle
}: {
  title: string;
  items: Array<{ id: string; label: string; detail?: string }>;
  checked: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="surface p-4 sm:p-6">
      <h2 className="mb-4 text-xl font-semibold text-bark">{title}</h2>
      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <label key={item.id} className="flex min-h-14 cursor-pointer items-start gap-3 rounded-lg bg-cream p-3 text-sm font-semibold text-cocoa">
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                  checked[item.id] ? "border-forest bg-forest text-cream" : "border-tan bg-ivory"
                }`}
              >
                {checked[item.id] && <Check size={16} aria-hidden />}
              </span>
              <input className="sr-only" type="checkbox" checked={Boolean(checked[item.id])} onChange={() => onToggle(item.id)} />
              <span className={checked[item.id] ? "text-cocoa/55 line-through" : ""}>
                {item.label}
                {item.detail && <span className="mt-1 block text-xs font-semibold text-cocoa/55">{item.detail}</span>}
              </span>
            </label>
          ))
        ) : (
          <p className="rounded-lg bg-cream px-3 py-3 text-sm font-semibold text-cocoa/70">Nothing saved.</p>
        )}
      </div>
    </div>
  );
}
