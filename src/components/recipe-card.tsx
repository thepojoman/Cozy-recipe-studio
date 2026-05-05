import Link from "next/link";
import { Clock, ChefHat } from "lucide-react";
import type { Recipe } from "@/lib/types";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const cover = recipe.photos.find((photo) => photo.isCoverPhoto) ?? recipe.photos[0];

  return (
    <article className="surface overflow-hidden">
      <Link href={`/recipes/${recipe.id}`} className="block focus:outline-none focus:ring-2 focus:ring-forest/40">
        <div className="aspect-[4/3] w-full bg-sage/50">
          {cover ? (
            <img src={cover.photoUrl} alt={recipe.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-lilac/45 text-plum">
              <ChefHat size={38} aria-hidden />
            </div>
          )}
        </div>
        <div className="space-y-4 p-4">
          <div className="space-y-3">
            <h2 className="recipe-title text-base sm:text-lg">{recipe.title}</h2>
            <div className="flex items-center gap-2 text-sm font-semibold text-cocoa/80">
              <Clock size={16} aria-hidden />
              <span>{recipe.estimatedTotalTimeMinutes} min</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="chip">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </article>
  );
}
