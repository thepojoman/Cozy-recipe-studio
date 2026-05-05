import { RecipeEditClient } from "@/components/recipe-edit-client";

type RouteParams = Promise<{ id: string }>;

export default async function EditRecipePage({ params }: { params: RouteParams }) {
  const resolvedParams = await params;
  return <RecipeEditClient id={resolvedParams.id} />;
}
