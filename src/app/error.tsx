"use client";

import { RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="surface flex min-h-80 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="recipe-title">Something Spilled</h1>
      <p className="max-w-md text-sm font-semibold text-cocoa/75">The recipe box hit a snag.</p>
      <button type="button" className="primary-button" onClick={reset}>
        <RotateCcw size={18} aria-hidden />
        Try again
      </button>
    </div>
  );
}
