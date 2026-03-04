"use client";

import { ChevronDown } from "lucide-react";

export function DebugPanel() {
  return (
    <details className="group shrink-0 border-t border-zinc-200 bg-zinc-50">
      <summary className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 list-none [&::-webkit-details-marker]:hidden hover:bg-zinc-100/50">
        <ChevronDown
          className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden
        />
        Event log
      </summary>
      <div className="px-4 pb-2">
        {/* Event store content will render here */}
      </div>
    </details>
  );
}
