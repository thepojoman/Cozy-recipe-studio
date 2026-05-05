"use client";

import { Plus, Tags, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { suggestedTags } from "@/lib/constants";
import { loadRecipes } from "@/lib/recipe-repository";
import { hasSupabaseConfig } from "@/lib/supabase";
import { listCustomTags, saveCustomTags } from "@/lib/recipe-store";

export default function SettingsPage() {
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [recipeTags, setRecipeTags] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    setCustomTags(listCustomTags());

    async function load() {
      const recipes = await loadRecipes();
      if (active) {
        setRecipeTags([...new Set(recipes.flatMap((recipe) => recipe.tags))]);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const allTags = useMemo(() => {
    return [...new Set([...suggestedTags, ...customTags, ...recipeTags])].sort((a, b) => a.localeCompare(b));
  }, [customTags, recipeTags]);

  function addTag() {
    const tag = newTag.trim();
    if (!tag) return;
    const nextTags = [...new Set([...customTags, tag])];
    setCustomTags(nextTags);
    saveCustomTags(nextTags);
    setNewTag("");
  }

  function removeTag(tag: string) {
    const nextTags = customTags.filter((item) => item !== tag);
    setCustomTags(nextTags);
    saveCustomTags(nextTags);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h1 className="recipe-title">Tag Manager</h1>
        <div className="surface grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:p-6">
          <input
            className="soft-input"
            value={newTag}
            onChange={(event) => setNewTag(event.target.value)}
            placeholder="Add a new theme tag"
          />
          <button type="button" className="primary-button" onClick={addTag}>
            <Plus size={18} aria-hidden />
            Add tag
          </button>
        </div>
      </section>

      <section className="surface space-y-4 p-4 sm:p-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-bark">
          <Tags size={20} aria-hidden />
          Themes
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {allTags.map((tag) => {
            const custom = customTags.includes(tag);

            return (
              <div key={tag} className="flex min-h-14 items-center justify-between gap-3 rounded-lg bg-cream px-3 py-2">
                <span className="font-semibold text-cocoa">{tag}</span>
                {custom && (
                  <button type="button" className="icon-button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                    <Trash2 size={17} aria-hidden />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="surface p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-bark">Supabase</h2>
          <p className="mt-3 text-sm font-semibold text-cocoa/75">
            {hasSupabaseConfig ? "Environment keys detected." : "Local mock mode is active."}
          </p>
        </div>
        <div className="surface p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-bark">Storage</h2>
          <p className="mt-3 text-sm font-semibold text-cocoa/75">Bucket: recipe-photos</p>
        </div>
        <div className="surface p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-bark">Palette</h2>
          <div className="mt-4 flex gap-2">
            {["bg-sage", "bg-forest", "bg-lilac", "bg-cream", "bg-tan", "bg-cocoa"].map((color) => (
              <span key={color} className={`h-10 w-10 rounded-lg border border-tan/50 ${color}`} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
