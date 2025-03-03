// components/ui/tooltip.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: "top" | "right" | "bottom" | "left";
  className?: string;
}

export const Tooltip = ({
  children,
  content,
  position = "top",
  className,
}: TooltipProps) => {
  const [isVisible, setIsVisible] = React.useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-2",
    right: "left-full top-1/2 transform -translate-y-1/2 translate-x-2 ml-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 translate-y-2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 -translate-x-2 mr-2",
  };

  return (
    <div className="relative inline-flex">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-flex"
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 px-2 py-1 text-xs bg-black text-white rounded shadow pointer-events-none whitespace-nowrap",
            positionClasses[position],
            className
          )}
        >
          {content}
          <div
            className={cn(
              "absolute w-2 h-2 bg-black transform rotate-45",
              position === "top" && "bottom-0 left-1/2 -translate-x-1/2 translate-y-1",
              position === "right" && "left-0 top-1/2 -translate-y-1/2 -translate-x-1",
              position === "bottom" && "top-0 left-1/2 -translate-x-1/2 -translate-y-1",
              position === "left" && "right-0 top-1/2 -translate-y-1/2 translate-x-1"
            )}
          />
        </div>
      )}
    </div>
  );
};