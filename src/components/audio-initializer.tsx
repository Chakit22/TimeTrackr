"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { initializeAudio } from "@/lib/sounds";

export function AudioInitializer() {
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Show the prompt after a short delay
    const timer = setTimeout(() => {
      // Check if we're in the browser
      if (typeof window !== "undefined") {
        // Only show if audio context might be suspended
        setShowPrompt(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleInitializeAudio = () => {
    try {
      // Use our dedicated function to initialize audio with 5-second limit
      initializeAudio();

      // Mark as initialized
      setAudioInitialized(true);
      setShowPrompt(false);
    } catch (error) {
      console.error("Error initializing audio:", error);
    }
  };

  // Don't show anything if already initialized or prompt not shown
  if (audioInitialized || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white p-2 flex justify-between items-center">
      <p className="text-sm">Click the button to enable sound notifications</p>
      <Button
        onClick={handleInitializeAudio}
        variant="outline"
        className="bg-white text-blue-500 hover:bg-blue-50 border-white"
        size="sm"
      >
        Enable Sounds
      </Button>
    </div>
  );
}
