"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function SidebarOverlay({ isOpen, onClose, children }: SidebarOverlayProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed left-0 top-0 h-full z-50 bg-white shadow-xl animate-in slide-in-from-left duration-300 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 shrink-0">
          <span className="text-sm font-medium text-zinc-700">Sessions</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </>
  );
}
