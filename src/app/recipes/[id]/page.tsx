import { RecipeDetailClient } from "@/components/recipe-detail-client";

type RouteParams = Promise<{ id: string }>;

export default async function RecipeDetailPage({ params }: { params: RouteParams }) {
  const resolvedParams = await params;
  return <RecipeDetailClient id={resolvedParams.id} />;
}
