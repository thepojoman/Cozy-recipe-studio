import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export async function uploadRecipePhoto(file: File, recipeId: string) {
  return uploadRecipePhotoBlob(file, recipeId, file.name.split(".").pop() || "jpg");
}

export async function uploadRecipePhotoBlob(blob: Blob, recipeId: string, extension = "jpg") {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const bucket = process.env.NEXT_PUBLIC_SUPABASE_RECIPE_PHOTO_BUCKET || "recipe-photos";
  const path = `${recipeId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    cacheControl: "3600",
    upsert: false
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadDataUrlRecipePhoto(dataUrl: string, recipeId: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const subtype = blob.type.includes("/")
    ? blob.type.split("/")[1].replace("svg+xml", "svg").replace(/[^a-z0-9]/gi, "")
    : "jpg";
  const extension = subtype || "jpg";
  return uploadRecipePhotoBlob(blob, recipeId, extension);
}
