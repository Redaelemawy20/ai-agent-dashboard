"use client";

export interface ExpandedToolDetailProps {
  selectedToolCallId: string | null;
}

export function ExpandedToolDetail({
  selectedToolCallId,
}: ExpandedToolDetailProps) {
  return (
    <div className="expanded-tool-detail-placeholder" data-selected-id={selectedToolCallId}>
      {/* Expanded tool call details — content TBD */}
    </div>
  );
}
