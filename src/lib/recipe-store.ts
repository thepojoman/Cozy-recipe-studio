"use client";

import { seedRecipes } from "@/lib/mock-data";
import type { Recipe, RecipeDraft } from "@/lib/types";
import { createId } from "@/lib/id";

const storageKey = "cozy_recipe_studio_recipes";
const tagStorageKey = "cozy_recipe_studio_tags";

function isBrowser() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  const stored = window.localStorage.getItem(key);
  if (!stored) {
    return fallback;
  }

  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (isBrowser()) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

export function listRecipes(): Recipe[] {
  return readJson<Recipe[]>(storageKey, seedRecipes);
}

export function getRecipe(id: string): Recipe | null {
  return listRecipes().find((recipe) => recipe.id === id) ?? null;
}

export function saveRecipe(draft: RecipeDraft): Recipe {
  const recipe: Recipe = {
    ...draft,
    id: draft.id ?? createId("recipe"),
    createdAt: new Date().toISOString()
  };
  const recipes = [recipe, ...listRecipes().filter((item) => item.id !== recipe.id)];
  writeJson(storageKey, recipes);
  return recipe;
}

export function updateRecipe(recipe: Recipe): Recipe {
  const recipes = listRecipes().map((item) => (item.id === recipe.id ? recipe : item));
  writeJson(storageKey, recipes);
  return recipe;
}

export function deleteRecipe(id: string) {
  writeJson(
    storageKey,
    listRecipes().filter((recipe) => recipe.id !== id)
  );
}

export function listCustomTags(): string[] {
  return readJson<string[]>(tagStorageKey, []);
}

export function saveCustomTags(tags: string[]) {
  writeJson(tagStorageKey, [...new Set(tags)].sort((a, b) => a.localeCompare(b)));
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}
