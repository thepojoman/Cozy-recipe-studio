"use client";

import Link from "next/link";
import { Search, SlidersHorizontal, Sparkles, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { RecipeCard } from "@/components/recipe-card";
import { loadingMessages, suggestedTags } from "@/lib/constants";
import { loadRecipes } from "@/lib/recipe-repository";
import { listCustomTags } from "@/lib/recipe-store";
import type { Recipe } from "@/lib/types";

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    setLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
    const timeout = window.setTimeout(async () => {
      setRecipes(await loadRecipes());
      setLoading(false);
    }, 280);

    return () => window.clearTimeout(timeout);
  }, []);

  const allTags = useMemo(() => {
    const recipeTags = recipes.flatMap((recipe) => recipe.tags);
    return ["All", ...new Set([...suggestedTags, ...listCustomTags(), ...recipeTags])];
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return recipes.filter((recipe) => {
      const haystack = [
        recipe.title,
        recipe.description,
        ...recipe.tags,
        ...recipe.ingredients.map((ingredient) => ingredient.name)
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !needle || haystack.includes(needle);
      const matchesTag = activeTag === "All" || recipe.tags.includes(activeTag);

      return matchesQuery && matchesTag;
    });
  }, [activeTag, query, recipes]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-3">
          <h1 className="recipe-title">Recipe Library</h1>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cocoa/55" size={18} aria-hidden />
              <input
                className="soft-input pl-10"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, ingredient, or tag"
              />
            </label>
            <Link href="/create" className="primary-button">
              <Sparkles size={18} aria-hidden />
              New recipe
            </Link>
            <Link href="/upload" className="secondary-button">
              <Upload size={18} aria-hidden />
              Upload
            </Link>
          </div>
        </div>
      </section>

      <section className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter by tag">
        {allTags.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`chip min-h-11 shrink-0 ${activeTag === tag ? "border-forest bg-sage text-bark" : ""}`}
            onClick={() => setActiveTag(tag)}
          >
            {tag === "All" && <SlidersHorizontal size={15} aria-hidden />}
            {tag}
          </button>
        ))}
      </section>

      {loading ? (
        <div className="surface flex min-h-80 items-center justify-center p-8 text-center text-lg font-semibold text-cocoa">
          {loadingMessage}
        </div>
      ) : filteredRecipes.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </section>
      ) : recipes.length > 0 ? (
        <EmptyState title="No saved recipes match that search." actionHref="/create" actionLabel="Create recipe" />
      ) : (
        <EmptyState title="Your recipe box is waiting for its first keeper." actionHref="/create" actionLabel="Create recipe" />
      )}
    </div>
  );
}
