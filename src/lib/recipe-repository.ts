"use client";

import { createId } from "@/lib/id";
import { deleteRecipe, getRecipe, listRecipes, saveRecipe, updateRecipe } from "@/lib/recipe-store";
import { hasSupabaseConfig, supabase, uploadDataUrlRecipePhoto } from "@/lib/supabase";
import type { Equipment, Ingredient, Instruction, Recipe, RecipeDraft, RecipePhoto } from "@/lib/types";

function recipeRow(recipe: RecipeDraft) {
  return {
    title: recipe.title,
    description: recipe.description,
    servings: recipe.servings,
    estimated_prep_time_minutes: recipe.estimatedPrepTimeMinutes,
    estimated_cook_time_minutes: recipe.estimatedCookTimeMinutes,
    estimated_total_time_minutes: recipe.estimatedTotalTimeMinutes,
    actual_total_time_minutes: recipe.actualTotalTimeMinutes,
    actual_time_notes: recipe.actualTimeNotes
  };
}

function mapRecipe(row: any): Recipe {
  const ingredients: Ingredient[] = (row.ingredients ?? []).map((ingredient: any) => ({
    id: ingredient.id,
    recipeId: ingredient.recipe_id,
    name: ingredient.name,
    quantity: ingredient.quantity === null ? null : Number(ingredient.quantity),
    unit: ingredient.unit ?? "",
    originalText: ingredient.original_text ?? "",
    scalable: Boolean(ingredient.scalable)
  }));
  const instructions: Instruction[] = (row.instructions ?? [])
    .map((instruction: any) => ({
      id: instruction.id,
      recipeId: instruction.recipe_id,
      stepNumber: instruction.step_number,
      text: instruction.text,
      hasTimer: Boolean(instruction.has_timer),
      timerSeconds: instruction.timer_seconds
    }))
    .sort((a: Instruction, b: Instruction) => a.stepNumber - b.stepNumber);
  const equipment: Equipment[] = (row.recipe_equipment ?? []).map((item: any) => ({
    id: item.id,
    recipeId: item.recipe_id,
    name: item.name,
    notes: item.notes ?? ""
  }));
  const photos: RecipePhoto[] = (row.recipe_photos ?? []).map((photo: any) => ({
    id: photo.id,
    recipeId: photo.recipe_id,
    photoUrl: photo.photo_url,
    isCoverPhoto: Boolean(photo.is_cover_photo),
    createdAt: photo.created_at
  }));
  const tags = (row.recipe_tags ?? [])
    .map((relation: any) => {
      const tag = Array.isArray(relation.tags) ? relation.tags[0] : relation.tags;
      return tag?.name;
    })
    .filter(Boolean);

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    servings: row.servings ?? 1,
    estimatedPrepTimeMinutes: row.estimated_prep_time_minutes ?? 0,
    estimatedCookTimeMinutes: row.estimated_cook_time_minutes ?? 0,
    estimatedTotalTimeMinutes: row.estimated_total_time_minutes ?? 0,
    actualTotalTimeMinutes: row.actual_total_time_minutes,
    actualTimeNotes: row.actual_time_notes ?? "",
    ingredients,
    instructions,
    equipment,
    photos,
    tags,
    createdAt: row.created_at
  };
}

async function fetchRecipeRows(id?: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  let query = supabase
    .from("recipes")
    .select(
      `
      *,
      ingredients(*),
      instructions(*),
      recipe_equipment(*),
      recipe_photos(*),
      recipe_tags(tags(*))
    `
    )
    .order("created_at", { ascending: false });

  if (id) {
    query = query.eq("id", id);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function replaceRelations(recipeId: string, draft: RecipeDraft) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const deleteResults = await Promise.all([
    supabase.from("ingredients").delete().eq("recipe_id", recipeId),
    supabase.from("instructions").delete().eq("recipe_id", recipeId),
    supabase.from("recipe_equipment").delete().eq("recipe_id", recipeId),
    supabase.from("recipe_photos").delete().eq("recipe_id", recipeId),
    supabase.from("recipe_tags").delete().eq("recipe_id", recipeId)
  ]);
  const deleteError = deleteResults.find((result) => result.error)?.error;

  if (deleteError) {
    throw deleteError;
  }

  const ingredientRows = draft.ingredients.map((ingredient) => ({
    recipe_id: recipeId,
    name: ingredient.name,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    original_text: ingredient.originalText,
    scalable: ingredient.scalable
  }));
  const instructionRows = draft.instructions.map((instruction, index) => ({
    recipe_id: recipeId,
    step_number: index + 1,
    text: instruction.text,
    has_timer: instruction.hasTimer,
    timer_seconds: instruction.timerSeconds
  }));
  const equipmentRows = draft.equipment.map((item) => ({
    recipe_id: recipeId,
    name: item.name,
    notes: item.notes ?? ""
  }));
  const photoRows = draft.photos.map((photo, index) => ({
    recipe_id: recipeId,
    photo_url: photo.photoUrl,
    is_cover_photo: photo.isCoverPhoto || index === 0
  }));

  const insertResults = await Promise.all([
    ingredientRows.length ? supabase.from("ingredients").insert(ingredientRows) : Promise.resolve(),
    instructionRows.length ? supabase.from("instructions").insert(instructionRows) : Promise.resolve(),
    equipmentRows.length ? supabase.from("recipe_equipment").insert(equipmentRows) : Promise.resolve(),
    photoRows.length ? supabase.from("recipe_photos").insert(photoRows) : Promise.resolve()
  ]);
  const insertError = insertResults.map((result) => (result as { error?: unknown } | undefined)?.error).find(Boolean);

  if (insertError) {
    throw insertError;
  }

  if (draft.tags.length > 0) {
    const { data: tagRows, error } = await supabase
      .from("tags")
      .upsert(
        draft.tags.map((name) => ({ name })),
        { onConflict: "name" }
      )
      .select("id,name");

    if (error) {
      throw error;
    }

    const relationRows = (tagRows ?? []).map((tag) => ({
      recipe_id: recipeId,
      tag_id: tag.id
    }));

    if (relationRows.length > 0) {
      const { error: relationError } = await supabase.from("recipe_tags").insert(relationRows);

      if (relationError) {
        throw relationError;
      }
    }
  }
}

async function preparePhotoStorage(recipeId: string, draft: RecipeDraft): Promise<RecipeDraft> {
  if (!hasSupabaseConfig || !supabase || draft.photos.length === 0) {
    return draft;
  }

  const photos = await Promise.all(
    draft.photos.map(async (photo) => {
      if (!photo.photoUrl.startsWith("data:")) {
        return photo;
      }

      return {
        ...photo,
        photoUrl: await uploadDataUrlRecipePhoto(photo.photoUrl, recipeId)
      };
    })
  );

  return {
    ...draft,
    photos
  };
}

export async function loadRecipes(): Promise<Recipe[]> {
  if (!hasSupabaseConfig) {
    return listRecipes();
  }

  try {
    const rows = await fetchRecipeRows();
    return rows.map(mapRecipe);
  } catch (error) {
    console.warn("Falling back to local recipes:", error);
    return listRecipes();
  }
}

export async function loadRecipe(id: string): Promise<Recipe | null> {
  if (!hasSupabaseConfig) {
    return getRecipe(id);
  }

  try {
    const rows = await fetchRecipeRows(id);
    return rows[0] ? mapRecipe(rows[0]) : null;
  } catch (error) {
    console.warn("Falling back to local recipe:", error);
    return getRecipe(id);
  }
}

export async function createRecipe(draft: RecipeDraft): Promise<Recipe> {
  if (!hasSupabaseConfig || !supabase) {
    return saveRecipe(draft);
  }

  try {
    const { data, error } = await supabase.from("recipes").insert(recipeRow(draft)).select("*").single();

    if (error) {
      throw error;
    }

    const draftWithStoredPhotos = await preparePhotoStorage(data.id, draft);
    await replaceRelations(data.id, draftWithStoredPhotos);
    const created = await loadRecipe(data.id);

    if (!created) {
      throw new Error("Recipe was created but could not be reloaded.");
    }

    return created;
  } catch (error) {
    console.warn("Supabase create failed; saving locally:", error);
    return saveRecipe(draft);
  }
}

export async function updateFullRecipe(recipe: Recipe): Promise<Recipe> {
  if (!hasSupabaseConfig || !supabase) {
    return updateRecipe(recipe);
  }

  try {
    const { error } = await supabase.from("recipes").update(recipeRow(recipe)).eq("id", recipe.id);

    if (error) {
      throw error;
    }

    const recipeWithStoredPhotos = await preparePhotoStorage(recipe.id, recipe);
    await replaceRelations(recipe.id, recipeWithStoredPhotos);
    const updated = await loadRecipe(recipe.id);

    if (!updated) {
      throw new Error("Recipe was updated but could not be reloaded.");
    }

    return updated;
  } catch (error) {
    console.warn("Supabase update failed; saving locally:", error);
    return updateRecipe(recipe);
  }
}

export async function removeRecipe(id: string) {
  if (!hasSupabaseConfig || !supabase) {
    deleteRecipe(id);
    return;
  }

  try {
    const { error } = await supabase.from("recipes").delete().eq("id", id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.warn("Supabase delete failed; deleting locally:", error);
    deleteRecipe(id);
  }
}

export function draftToRecipe(draft: RecipeDraft, existing?: Recipe): Recipe {
  return {
    ...draft,
    id: existing?.id ?? draft.id ?? createId("recipe"),
    createdAt: existing?.createdAt ?? new Date().toISOString()
  };
}
