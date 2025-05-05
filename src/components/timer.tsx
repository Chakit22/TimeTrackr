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

interface TimerProps {
  task: string;
  duration: number; // in seconds
  recurrentTime: number; // in seconds
  notificationSound: string; // sound ID for notifications
  completionSound: string; // sound ID for completion
  onComplete: () => void;
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasCalledOnComplete = useRef(false);

  // Reset timer when task changes - announce task but don't play sound
  useEffect(() => {
    setTimeLeft(duration);
    setIsRunning(true);
    hasCalledOnComplete.current = false;
    setNotifications([]);
    lastNotificationTime.current = 0;

    // Announce the task has started (voice only, no alarm)
    const startedMessage = `Started ${task}`;
    speakText(startedMessage);
    setNotifications([
      `Started at ${new Date().toLocaleTimeString()}: ${startedMessage}`,
    ]);
  }, [task, duration]);

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            setIsRunning(false);

            // Ensure onComplete is called only once
            if (!hasCalledOnComplete.current) {
              hasCalledOnComplete.current = true;

              const completionSequence = async () => {
                try {
                  // Log notification immediately
                  const newNotification = `Task completed at ${new Date().toLocaleTimeString()}`;
                  setNotifications((prev) => [...prev, newNotification]);

                  // 1. First play the completion sound
                  const sound =
                    completionSounds.find((s) => s.id === completionSound) ||
                    completionSounds[0];
                  playSound(sound.src);

                  // 2. Wait for sound to play (exactly 5 seconds) before speaking
                  await new Promise((resolve) => setTimeout(resolve, 5000));

                  // 3. Then speak the completion message
                  speakText(
                    `Task ${task} should be completed by now. Moving to the next task.`
                  );

                  // 4. Wait for speech to finish (approximately) before moving to next task
                  await new Promise((resolve) => setTimeout(resolve, 3000));

                  // 5. Finally call onComplete to move to the next task
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
            return 0;
          }

          // Check if we need to announce recurrent time notification
          const elapsed = duration - prev;
          if (
            recurrentTime > 0 &&
            elapsed > 0 &&
            elapsed % recurrentTime < 1 &&
            Date.now() - lastNotificationTime.current > 5000
          ) {
            lastNotificationTime.current = Date.now();

            const notificationSequence = async () => {
              try {
                // 1. First play notification sound
                const sound =
                  notificationSounds.find((s) => s.id === notificationSound) ||
                  notificationSounds[0];
                playSound(sound.src);

                // Log notification early so it appears in UI
                const elapsedVerbose = formatTimeVerbose(elapsed);
                const newNotification = `${elapsedVerbose} have passed`;
                setNotifications((prev) => [...prev, newNotification]);

                // 2. Wait for sound to play (5 seconds) before speaking
                await new Promise((resolve) => setTimeout(resolve, 5000));

                // 3. Then speak notification
                speakText(`${elapsedVerbose} have passed`);
              } catch (error) {
                console.error("Error playing notification sound:", error);
              }
            };

            // Start notification sequence
            notificationSequence();
          }

          // Final minute announcement
          if (prev === 60) {
            const finalMinuteSequence = async () => {
              try {
                // 1. Play notification sound
                const sound =
                  notificationSounds.find((s) => s.id === notificationSound) ||
                  notificationSounds[0];
                playSound(sound.src);

                // Log notification early
                const newNotification = "1 minute left";
                setNotifications((prev) => [...prev, newNotification]);

                // 2. Wait for sound to play (5 seconds) before speaking
                await new Promise((resolve) => setTimeout(resolve, 5000));

                // 3. Speak the notification
                speakText("1 minute left");
              } catch (error) {
                console.error("Error playing notification sound:", error);
              }
            };

            // Start the final minute sequence
            finalMinuteSequence();
          }

          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [
    isRunning,
    duration,
    recurrentTime,
    task,
    onComplete,
    notificationSound,
    completionSound,
  ]);

  const toggleTimer = () => {
    if (!isRunning && timeLeft === 0) {
      // Reset timer
      setTimeLeft(duration);
      setNotifications([]);
      hasCalledOnComplete.current = false;
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
    setNotifications([]);
    hasCalledOnComplete.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
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
