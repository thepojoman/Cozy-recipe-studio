import { ChefHat } from "lucide-react";

export default function Loading() {
  return (
    <div className="surface flex min-h-80 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-sage text-bark">
        <ChefHat size={24} aria-hidden />
      </div>
      <p className="text-lg font-semibold text-cocoa">Warming the skillet...</p>
    </div>
  );
}
