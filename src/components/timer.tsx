"use client";

import { useState, useEffect, useRef } from "react";
import { formatTime, speakText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatTimeVerbose,
  playSound,
  notificationSounds,
  completionSounds,
} from "@/lib/sounds";
import {
  requestNotificationPermission,
  showNotification,
  setupVisibilityDetection,
} from "@/lib/notifications";

interface TimerProps {
  task: string;
  duration: number; // in seconds
  recurrentTime: number; // in seconds
  notificationSound: string; // sound ID for notifications
  completionSound: string; // sound ID for completion
  onComplete: () => void;
}

// Worker notification data type
interface WorkerNotificationData {
  type: "recurrent" | "finalMinute";
  elapsed?: number;
}

export function Timer({
  task,
  duration,
  recurrentTime,
  notificationSound,
  completionSound,
  onComplete,
}: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(true); // Auto-start timer
  const [notifications, setNotifications] = useState<string[]>([]);
  const lastNotificationTime = useRef(0);
  const hasCalledOnComplete = useRef(false);
  const workerRef = useRef<Worker | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Initialize notifications permission
  useEffect(() => {
    const initNotifications = async () => {
      const hasPermission = await requestNotificationPermission();
      setNotificationsEnabled(hasPermission);
    };

    initNotifications();

    // Setup visibility detection
    const cleanupVisibility = setupVisibilityDetection((visible) => {
      setIsVisible(visible);
    });

    return cleanupVisibility;
  }, []);

  // Initialize worker
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Create worker when component mounts
      workerRef.current = new Worker("/timer-worker.js");

      // Set up message handler for worker
      workerRef.current.onmessage = (e) => {
        const { type, data } = e.data;

        switch (type) {
          case "tick":
            setTimeLeft(data.timeLeft);
            break;

          case "notification":
            handleWorkerNotification(data);
            break;

          case "complete":
            handleTaskComplete();
            break;

          case "reset":
            setTimeLeft(data.timeLeft);
            break;
        }
      };
    }

    // Clean up worker when component unmounts
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Handle notifications from worker
  const handleWorkerNotification = (data: WorkerNotificationData) => {
    if (data.type === "recurrent" && data.elapsed !== undefined) {
      const elapsed = data.elapsed;
      const elapsedVerbose = formatTimeVerbose(elapsed);
      const newNotification = `${elapsedVerbose} have passed`;

      // Add to UI notifications
      setNotifications((prev) => [...prev, newNotification]);

      // Handle sound and voice notifications
      const notificationSequence = async () => {
        try {
          // 1. First play notification sound
          const sound =
            notificationSounds.find((s) => s.id === notificationSound) ||
            notificationSounds[0];
          playSound(sound.src);

          // 2. Show system notification if page is not visible
          if (!isVisible && notificationsEnabled) {
            showNotification(`${task} - Time Update`, {
              body: newNotification,
              icon: "/favicon.ico",
            });
          }

          // 3. Wait for sound to play (5 seconds) before speaking
          await new Promise((resolve) => setTimeout(resolve, 5000));

          // 4. Then speak notification if page is visible
          if (isVisible) {
            speakText(newNotification);
          }
        } catch (error) {
          console.error("Error playing notification sound:", error);
        }
      };

      notificationSequence();
    } else if (data.type === "finalMinute") {
      const newNotification = "1 minute left";

      // Add to UI notifications
      setNotifications((prev) => [...prev, newNotification]);

      const finalMinuteSequence = async () => {
        try {
          // 1. Play notification sound
          const sound =
            notificationSounds.find((s) => s.id === notificationSound) ||
            notificationSounds[0];
          playSound(sound.src);

          // 2. Show system notification if page is not visible
          if (!isVisible && notificationsEnabled) {
            showNotification(`${task} - Almost Done`, {
              body: newNotification,
              icon: "/favicon.ico",
            });
          }

          // 3. Wait for sound to play (5 seconds) before speaking
          await new Promise((resolve) => setTimeout(resolve, 5000));

          // 4. Speak the notification if page is visible
          if (isVisible) {
            speakText(newNotification);
          }
        } catch (error) {
          console.error("Error playing notification sound:", error);
        }
      };

      finalMinuteSequence();
    }
  };

  // Reset timer when task changes - announce task but don't play sound
  useEffect(() => {
    setTimeLeft(duration);
    setIsRunning(true);
    hasCalledOnComplete.current = false;
    setNotifications([]);
    lastNotificationTime.current = 0;

    // Update the worker with new task details
    if (workerRef.current) {
      workerRef.current.postMessage({
        action: "update",
        data: {
          duration,
          timeLeft: duration,
          recurrentTime,
        },
      });
    }

    // Announce the task has started (voice only, no alarm)
    const startedMessage = `Started ${task}`;
    speakText(startedMessage);
    setNotifications([
      `Started at ${new Date().toLocaleTimeString()}: ${startedMessage}`,
    ]);

    // Start the worker timer
    if (workerRef.current) {
      workerRef.current.postMessage({
        action: "start",
        data: {
          duration,
          timeLeft: duration,
          recurrentTime,
        },
      });
    }
  }, [task, duration, recurrentTime]);

  const handleTaskComplete = async () => {
    // Ensure onComplete is called only once
    if (!hasCalledOnComplete.current) {
      hasCalledOnComplete.current = true;
      setIsRunning(false);

      // Log notification immediately
      const newNotification = `Task completed at ${new Date().toLocaleTimeString()}`;
      setNotifications((prev) => [...prev, newNotification]);

      const completionSequence = async () => {
        try {
          // 1. First play the completion sound
          const sound =
            completionSounds.find((s) => s.id === completionSound) ||
            completionSounds[0];
          playSound(sound.src);

          // 2. Show system notification if page is not visible
          if (!isVisible && notificationsEnabled) {
            showNotification(`${task} - Completed`, {
              body: "Task completed. Moving to the next task.",
              icon: "/favicon.ico",
            });
          }

          // 3. Wait for sound to play (exactly 5 seconds) before speaking
          await new Promise((resolve) => setTimeout(resolve, 5000));

          // 4. Then speak the completion message if page is visible
          if (isVisible) {
            speakText(
              `Task ${task} should be completed by now. Moving to the next task.`
            );
          }

          // 5. Wait for speech to finish (approximately) before moving to next task
          await new Promise((resolve) => setTimeout(resolve, 3000));

          // 6. Finally call onComplete to move to the next task
          onComplete();
        } catch (error) {
          console.error("Error in completion sequence:", error);
          // Fallback in case of error - still complete the task
          onComplete();
        }
      };

      // Start the completion sequence
      completionSequence();
    }
  };

  // Control worker based on isRunning state
  useEffect(() => {
    if (workerRef.current) {
      if (isRunning) {
        workerRef.current.postMessage({
          action: "start",
          data: {
            duration,
            timeLeft,
            recurrentTime,
          },
        });
      } else {
        workerRef.current.postMessage({
          action: "pause",
        });
      }
    }
  }, [isRunning, duration, timeLeft, recurrentTime]);

  const toggleTimer = () => {
    if (!isRunning && timeLeft === 0) {
      // Reset timer
      setTimeLeft(duration);
      setNotifications([]);
      hasCalledOnComplete.current = false;

      if (workerRef.current) {
        workerRef.current.postMessage({
          action: "reset",
          data: { duration },
        });
      }
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
    setNotifications([]);
    hasCalledOnComplete.current = false;

    if (workerRef.current) {
      workerRef.current.postMessage({
        action: "reset",
        data: { duration },
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto dark:text-slate-100 md:m-4 m-2">
      <CardHeader>
        <CardTitle className="text-center text-xl md:text-2xl">
          {task}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center px-4 md:px-6">
        <div className="text-4xl md:text-6xl font-bold my-4 md:my-8 text-slate-900 dark:text-slate-50">
          {formatTime(timeLeft)}
        </div>
        <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-2 md:mb-4">
          Duration: {formatTime(duration)} | Notify every:{" "}
          {formatTime(recurrentTime)}
        </div>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div
            className={`h-2 w-2 rounded-full ${
              isVisible ? "bg-green-500" : "bg-yellow-500"
            }`}
          ></div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {isVisible ? "Page is visible" : "Running in background"}
          </span>
          <div
            className={`h-2 w-2 rounded-full ${
              notificationsEnabled ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {notificationsEnabled
              ? "Notifications enabled"
              : "Notifications disabled"}
          </span>
        </div>
        <div className="max-h-32 overflow-y-auto w-full mt-3 md:mt-4 border border-slate-200 dark:border-slate-700 rounded-md p-2">
          <h3 className="font-semibold mb-1 md:mb-2 text-sm md:text-base text-slate-900 dark:text-slate-50">
            Notifications:
          </h3>
          {notifications.length === 0 ? (
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
              No notifications yet
            </p>
          ) : (
            <ul className="space-y-1">
              {notifications.map((notification, index) => (
                <li
                  key={index}
                  className="text-xs md:text-sm text-slate-700 dark:text-slate-300"
                >
                  {notification}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center gap-2 md:gap-4 pb-4 md:pb-6">
        <Button
          onClick={toggleTimer}
          variant={isRunning ? "danger" : "primary"}
          size="lg"
          className="text-sm md:text-base"
        >
          {isRunning ? "Pause" : timeLeft === 0 ? "Restart" : "Start"}
        </Button>
        <Button
          onClick={resetTimer}
          variant="outline"
          className="text-sm md:text-base"
        >
          Reset
        </Button>
      </CardFooter>
    </Card>
  );
}
