"use client";

import { useEffect, useState } from "react";
import { requestNotificationPermission } from "@/lib/notifications";
import { Button } from "./ui/button";

export function NotificationInitializer() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if browser supports notifications
    if (typeof window !== "undefined" && "Notification" in window) {
      // If permission status is default (not decided), show the prompt
      if (Notification.permission === "default") {
        setShowPrompt(true);
      }
    }
  }, []);

  const requestPermission = async () => {
    await requestNotificationPermission();
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg z-50 max-w-sm border border-slate-200 dark:border-slate-700">
      <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
        Enable Notifications
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
        Allow notifications to receive task updates when the app is in the
        background.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setShowPrompt(false)}>
          Later
        </Button>
        <Button onClick={requestPermission}>Enable</Button>
      </div>
    </div>
  );
}
