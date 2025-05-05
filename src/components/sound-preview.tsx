"use client";

import { Button } from "./ui/button";
import { playSound } from "@/lib/sounds";

interface SoundPreviewProps {
  src: string;
}

export function SoundPreview({ src }: SoundPreviewProps) {
  const handlePlay = () => {
    playSound(src);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="p-1 h-8 w-8 rounded-full"
      onClick={handlePlay}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
      <span className="sr-only">Play sound</span>
    </Button>
  );
}
