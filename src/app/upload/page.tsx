"use client";

import { useRouter } from "next/navigation";
import { ImageUp, Wand2 } from "lucide-react";
import { useState } from "react";
import { RecipeForm } from "@/components/recipe-form";
import { createId } from "@/lib/id";
import { mockOcrRecipe } from "@/lib/parser";
import { createRecipe } from "@/lib/recipe-repository";
import { fileToDataUrl } from "@/lib/recipe-store";
import type { RecipeDraft } from "@/lib/types";

export default function UploadRecipePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [draft, setDraft] = useState<RecipeDraft | null>(null);
  const [error, setError] = useState("");
  const [parsing, setParsing] = useState(false);

  async function handleFileChange(selectedFile: File | null) {
    setFile(selectedFile);
    setDraft(null);
    setError("");

    if (!selectedFile) {
      setPreview("");
      return;
    }

    try {
      setPreview(await fileToDataUrl(selectedFile));
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Could not read this image.");
    }
  }

  async function handleParse() {
    if (!file) {
      setError("Choose a screenshot or photo before parsing.");
      return;
    }

    setParsing(true);
    setError("");

    try {
      const parsed = await mockOcrRecipe(file);
      const photoUrl = preview || (await fileToDataUrl(file));
      setDraft({
        ...parsed,
        photos: [
          {
            id: createId("photo"),
            photoUrl,
            isCoverPhoto: true,
            createdAt: new Date().toISOString()
          }
        ]
      });
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "Could not parse this upload.");
    } finally {
      setParsing(false);
    }
  }

  async function handleSave(recipeDraft: RecipeDraft) {
    const recipe = await createRecipe(recipeDraft);
    router.push(`/recipes/${recipe.id}`);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h1 className="recipe-title">Upload Screenshot</h1>
        <div className="surface grid gap-4 p-4 sm:p-6 lg:grid-cols-[320px_1fr]">
          <label className="secondary-button min-h-64 cursor-pointer flex-col">
            {preview ? (
              <img src={preview} alt="Selected recipe upload" className="h-56 w-full rounded-lg object-cover" />
            ) : (
              <>
                <ImageUp size={34} aria-hidden />
                Choose image
              </>
            )}
            <input className="sr-only" type="file" accept="image/*" onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)} />
          </label>
          <div className="flex flex-col justify-center gap-4">
            <p className="text-lg font-semibold text-bark">{file ? file.name : "No image selected"}</p>
            {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
            <button type="button" className="primary-button w-fit" onClick={handleParse} disabled={parsing}>
              <Wand2 size={18} aria-hidden />
              {parsing ? "Reading image..." : "Mock OCR parse"}
            </button>
          </div>
        </div>
      </section>

      {draft && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-bark">OCR draft</h2>
          <RecipeForm key={`${draft.title}-${draft.photos.length}`} initialDraft={draft} onSave={handleSave} saveLabel="Save OCR recipe" />
        </section>
      )}
    </div>
  );
}
