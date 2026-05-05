import Link from "next/link";
import { ChefHat } from "lucide-react";

export function EmptyState({
  title,
  actionHref,
  actionLabel
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="surface flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage text-bark">
        <ChefHat size={24} aria-hidden />
      </div>
      <p className="max-w-sm text-lg font-semibold text-cocoa">{title}</p>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="primary-button">
          <ChefHat size={18} aria-hidden />
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
