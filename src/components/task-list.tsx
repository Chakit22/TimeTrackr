"use client";

import { useState, useEffect } from "react";
import { Task, TaskForm } from "./task-form";
import { Timer } from "./timer";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import {
  notificationSounds,
  completionSounds,
  preloadSounds,
} from "@/lib/sounds";
import { speakText } from "@/lib/utils";
import { NotificationInitializer } from "./notification-initializer";

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number | null>(null);
  const [allTasksCompleted, setAllTasksCompleted] = useState(false);

  // Preload sounds when the component mounts
  useEffect(() => {
    preloadSounds();
  }, []);

  const addTask = (task: Task) => {
    // Ensure the task has sound settings
    const taskWithSounds = {
      ...task,
      notificationSound: task.notificationSound || notificationSounds[0].id,
      completionSound: task.completionSound || completionSounds[0].id,
    };

    setTasks((prevTasks) => [...prevTasks, taskWithSounds]);

    // Reset all tasks completed flag when adding a new task
    setAllTasksCompleted(false);

    // Don't auto-start tasks anymore
  };

  const editTask = (updatedTask: Task) => {
    // Ensure sound preferences are preserved
    const taskWithSounds = {
      ...updatedTask,
      notificationSound:
        updatedTask.notificationSound || notificationSounds[0].id,
      completionSound: updatedTask.completionSound || completionSounds[0].id,
    };

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskWithSounds.id ? taskWithSounds : task
      )
    );
  };

  const removeTask = (taskId: string) => {
    const taskIndex = tasks.findIndex((task) => task.id === taskId);

    // Update current task index if needed
    if (currentTaskIndex !== null) {
      if (taskIndex === currentTaskIndex) {
        // If we're removing the current task, move to the next one or set to null
        if (tasks.length > 1) {
          if (taskIndex === tasks.length - 1) {
            setCurrentTaskIndex(0); // Wrap to the first task
          }
          // Otherwise stay on the same index (next task will take this position)
        } else {
          setCurrentTaskIndex(null); // No tasks left
        }
      } else if (taskIndex < currentTaskIndex) {
        // If we're removing a task before the current one, adjust the index
        setCurrentTaskIndex(currentTaskIndex - 1);
      }
    }

    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  const handleTaskComplete = () => {
    if (currentTaskIndex !== null && tasks.length > 0) {
      // Check if this was the last task in the sequence
      if (currentTaskIndex === tasks.length - 1) {
        // This was the final task
        setAllTasksCompleted(true);
        setCurrentTaskIndex(null);

        // Announce all tasks completed
        setTimeout(() => {
          speakText("All tasks completed. Your session is now finished.");
        }, 1000);
      } else {
        // Not the last task, move to the next one
        const nextIndex = currentTaskIndex + 1;
        setCurrentTaskIndex(nextIndex);
      }
    }
  };

  const startTask = (index: number) => {
    setCurrentTaskIndex(index);
    setAllTasksCompleted(false);
  };

  const resetTaskList = () => {
    setAllTasksCompleted(false);
    if (tasks.length > 0) {
      setCurrentTaskIndex(0);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-center mb-8 text-slate-900 dark:text-slate-50">
        Voice Timer
      </h1>

      <div className="space-y-6">
        {allTasksCompleted ? (
          <Card className="p-6 text-center">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-green-600 dark:text-green-400">
                All Tasks Completed!
              </h2>
              <p className="text-slate-700 dark:text-slate-300">
                Congratulations! You have completed all your tasks.
              </p>
              <Button onClick={resetTaskList} className="mt-4">
                Start Over
              </Button>
            </div>
          </Card>
        ) : currentTaskIndex !== null && tasks.length > 0 ? (
          <Timer
            task={tasks[currentTaskIndex].name}
            duration={tasks[currentTaskIndex].duration}
            recurrentTime={tasks[currentTaskIndex].recurrentTime}
            notificationSound={
              tasks[currentTaskIndex].notificationSound ||
              notificationSounds[0].id
            }
            completionSound={
              tasks[currentTaskIndex].completionSound || completionSounds[0].id
            }
            onComplete={handleTaskComplete}
          />
        ) : tasks.length > 0 ? (
          <Card className="p-6 text-center">
            <div className="space-y-4">
              <p className="text-slate-700 dark:text-slate-300">
                You have {tasks.length} task{tasks.length > 1 ? "s" : ""} ready
                to start.
              </p>
              <Button onClick={() => startTask(0)} className="mt-4">
                Start All Tasks
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-slate-700 dark:text-slate-300">
              No active task. Add a task to get started.
            </p>
          </Card>
        )}

        <TaskForm onAddTask={addTask} />

        {tasks.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-50">
              Your Tasks
            </h2>
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <Card
                  key={task.id}
                  className={`${
                    currentTaskIndex === index ? "border-blue-500 border-2" : ""
                  }`}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-50">
                        {task.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Duration: {Math.floor(task.duration / 60)} min | Notify
                        every:{" "}
                        {task.recurrentTime > 0
                          ? Math.floor(task.recurrentTime / 60)
                          : 0}{" "}
                        min
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startTask(index)}
                        disabled={currentTaskIndex === index}
                      >
                        {currentTaskIndex === index ? "Active" : "Start"}
                      </Button>
                      <TaskForm
                        onAddTask={addTask}
                        onEditTask={editTask}
                        taskToEdit={task}
                        buttonText={
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
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTask(task.id)}
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
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add notification initializer */}
      <NotificationInitializer />
    </div>
  );
}
