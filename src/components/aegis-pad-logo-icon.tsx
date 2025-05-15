import { cn } from "@/lib/utils";
import type { FC } from "react";

interface AegisPadLogoIconProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

const AegisPadLogoIcon: FC<AegisPadLogoIconProps> = ({
  className,
  width = "1.75rem",
  height = "1.75rem",
}) => {
  // 1.75rem is approx 28px, similar to h-7 w-7
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24" // Standard viewBox for simplified icon
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-hidden="true"
    >
      {/* Shield Outline - Teal stroke from primary color, background from card color */}
      <path
        d="M12 2L3 5V11C3 16.52 7.48 21.52 12 22C16.52 21.52 21 16.52 21 11V5L12 2Z"
        className="stroke-primary fill-card"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Stylized Pen Nib - Darker color (foreground) */}
      <path
        d="M12 7L9.5 13L12 16L14.5 13L12 7Z"
        className="fill-foreground" // Using foreground for the dark blue part of the pen
      />
      {/* Breather hole on pen nib - Shows card background color */}
      <circle cx="12" cy="10.5" r="0.75" className="fill-card" />

      {/* Three Lines - Teal lines, from primary color */}
      <line
        x1="6"
        y1="8"
        x2="8.5"
        y2="8"
        className="stroke-primary"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <line
        x1="6"
        y1="11"
        x2="8.5"
        y2="11"
        className="stroke-primary"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <line
        x1="6"
        y1="14"
        x2="8.5"
        y2="14"
        className="stroke-primary"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default AegisPadLogoIcon;
