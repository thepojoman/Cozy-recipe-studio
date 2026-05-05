"use client";

import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function TimerButton({ seconds, label }: { seconds: number; label: string }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setRemaining(seconds);
    setRunning(false);
  }, [seconds]);

  useEffect(() => {
    if (!running) {
      return;
    }

    const interval = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(interval);
          setRunning(false);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [running]);

  const finished = remaining === 0;
  const buttonLabel = useMemo(() => {
    if (finished) return "Done";
    return running ? "Pause" : "Start Timer";
  }, [finished, running]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className={finished ? "secondary-button bg-sage/40" : "secondary-button"}
        onClick={() => !finished && setRunning((value) => !value)}
        aria-label={`${buttonLabel} for ${label}`}
      >
        {running ? <Pause size={17} aria-hidden /> : <Play size={17} aria-hidden />}
        {buttonLabel}
      </button>
      <span className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-cream px-3 text-sm font-semibold text-cocoa">
        <Timer size={16} aria-hidden />
        {formatDuration(remaining)}
      </span>
      {remaining !== seconds && (
        <button type="button" className="icon-button" onClick={() => setRemaining(seconds)} aria-label="Reset timer">
          <RotateCcw size={17} aria-hidden />
        </button>
      )}
    </div>
  );
}

export function ManualTimer() {
  const [minutes, setMinutes] = useState(10);

  return (
    <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <label className="flex items-center gap-3 text-sm font-semibold text-cocoa">
        <Timer size={18} aria-hidden />
        Manual timer
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="soft-input w-28"
          min={1}
          type="number"
          value={minutes}
          onChange={(event) => setMinutes(Math.max(1, Number(event.target.value)))}
          aria-label="Manual timer minutes"
        />
        <span className="text-sm font-semibold text-cocoa/75">minutes</span>
        <TimerButton seconds={minutes * 60} label="manual timer" />
      </div>
    </div>
  );
}
