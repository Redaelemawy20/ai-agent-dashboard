"use client";

import { memo } from "react";
import { Menu, Monitor, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AISDKLogo } from "@/components/ui/icons";
import { DeployButton } from "@/components/project-info";
import { cn } from "@/lib/utils";

export interface HeaderProps {
  onMenuClick: () => void;
  showVncOnMobile?: boolean;
  onViewToggle?: () => void;
  className?: string;
}

export const Header = memo(function Header({
  onMenuClick,
  showVncOnMobile = false,
  onViewToggle,
  className,
}: HeaderProps) {
  return (
    <div
      className={cn(
        "bg-white py-4 px-4 flex justify-between items-center shrink-0 gap-2",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <AISDKLogo />
      </div>
      <div className="flex items-center gap-2">
        {onViewToggle && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs xl:hidden"
            onClick={onViewToggle}
            aria-pressed={showVncOnMobile}
            aria-label={showVncOnMobile ? "View chat" : "View desktop"}
          >
            {showVncOnMobile ? (
              <>
                <MessageSquare className="h-3.5 w-3.5" />
                View chat
              </>
            ) : (
              <>
                <Monitor className="h-3.5 w-3.5" />
                View desktop
              </>
            )}
          </Button>
        )}
        <DeployButton />
      </div>
    </div>
  );
});
