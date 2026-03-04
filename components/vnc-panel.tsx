"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";

export interface VncPanelProps {
  streamUrl: string | null;
  isInitializing: boolean;
  onRefreshDesktop: () => void;
}

function VncPanelInner({
  streamUrl,
  isInitializing,
  onRefreshDesktop,
}: VncPanelProps) {
  return (
    <div className="flex flex-col w-full h-full relative">
      {/* VNC viewer */}
      {streamUrl ? (
        <>
          <iframe
            src={streamUrl}
            className="w-full h-full flex-1 min-h-0"
            style={{
              transformOrigin: "center",
              width: "100%",
              height: "100%",
            }}
            allow="autoplay"
            title="VNC Desktop Stream"
          />
          <Button
            onClick={onRefreshDesktop}
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white px-3 py-1 rounded text-sm z-10"
            disabled={isInitializing}
          >
            {isInitializing ? "Creating desktop..." : "New desktop"}
          </Button>
        </>
      ) : (
        <div className="flex items-center justify-center flex-1 text-white">
          {isInitializing ? "Initializing desktop..." : "Loading stream..."}
        </div>
      )}
    </div>
  );
}

export const VncPanel = memo(VncPanelInner);
