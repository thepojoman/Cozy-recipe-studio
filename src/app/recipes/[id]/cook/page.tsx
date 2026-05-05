import { CookingModeClient } from "@/components/cooking-mode-client";

type RouteParams = Promise<{ id: string }> | { id: string };

export default async function CookingModePage({ params }: { params: RouteParams }) {
  const resolvedParams = await params;
  return <CookingModeClient id={resolvedParams.id} />;
}
