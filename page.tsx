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
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [draft, setDraft] = useState<RecipeDraft | null>(null);
  const [error, setError] = useState("");
  const [parsing, setParsing] = useState(false);

  async function handleFileChange(selectedFiles: FileList | null) {
    const nextFiles = selectedFiles ? [...selectedFiles] : [];
    setFiles(nextFiles);
    setDraft(null);
    setError("");

    if (nextFiles.length === 0) {
      setPreviews([]);
      return;
    }

    try {
      setPreviews(await Promise.all(nextFiles.map(fileToDataUrl)));
    } catch (readError) {
      setPreviews([]);
      setError(readError instanceof Error ? readError.message : "Could not read these images.");
    }
  }

  async function handleParse() {
    if (files.length === 0) {
      setError("Choose at least one screenshot or photo before parsing.");
      return;
    }

    setParsing(true);
    setError("");

    try {
      const parsed = await mockOcrRecipe(files[0]);
      const photoUrls = previews.length > 0 ? previews : await Promise.all(files.map(fileToDataUrl));
      setDraft({
        ...parsed,
        photos: photoUrls.map((photoUrl, index) => ({
          id: createId("photo"),
          photoUrl,
          isCoverPhoto: index === 0,
          createdAt: new Date().toISOString()
        }))
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
            {previews.length > 0 ? (
              <div className="grid h-full w-full grid-cols-2 gap-2">
                {previews.slice(0, 4).map((preview, index) => (
                  <div key={`${preview.slice(0, 32)}-${index}`} className="relative h-28 overflow-hidden rounded-lg">
                    <img src={preview} alt={`Selected recipe upload ${index + 1}`} className="h-full w-full object-cover" />
                    {index === 3 && previews.length > 4 && (
                      <span className="absolute inset-0 flex items-center justify-center bg-bark/55 text-lg font-bold text-cream">
                        +{previews.length - 4}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <ImageUp size={34} aria-hidden />
                Choose images
              </>
            )}
            <input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => handleFileChange(event.target.files)} />
          </label>
          <div className="flex flex-col justify-center gap-4">
            <p className="text-lg font-semibold text-bark">
              {files.length > 0 ? `${files.length} image${files.length === 1 ? "" : "s"} selected` : "No images selected"}
            </p>
            {files.length > 0 && (
              <ul className="space-y-1 text-sm font-semibold text-cocoa/75">
                {files.slice(0, 4).map((file) => (
                  <li key={`${file.name}-${file.size}`} className="truncate">
                    {file.name}
                  </li>
                ))}
                {files.length > 4 && <li>{files.length - 4} more</li>}
              </ul>
            )}
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
