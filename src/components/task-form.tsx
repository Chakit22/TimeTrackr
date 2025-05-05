"use client";

import { useState, FormEvent, useEffect, ReactNode } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { notificationSounds, completionSounds } from "@/lib/sounds";

export interface Task {
  id: string;
  name: string;
  duration: number; // In seconds
  recurrentTime: number; // In seconds
  notificationSound: string; // Sound ID for notifications
  completionSound: string; // Sound ID for completion
}

interface TaskFormProps {
  onAddTask: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  taskToEdit?: Task | null;
  buttonText?: ReactNode;
}

export function TaskForm({
  onAddTask,
  onEditTask,
  taskToEdit = null,
  buttonText = "Add New Task",
}: TaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [durationInMinutes, setDurationInMinutes] = useState("10");
  const [recurrentTimeInMinutes, setRecurrentTimeInMinutes] = useState("3");
  const [errors, setErrors] = useState<{
    name?: string;
    duration?: string;
    recurrentTime?: string;
  }>({});

  // Always use the guitar sound (first sound in the arrays)
  const notificationSound = notificationSounds[0].id;
  const completionSound = completionSounds[0].id;

  // Load task data when editing
  useEffect(() => {
    if (taskToEdit) {
      setName(taskToEdit.name);
      setDurationInMinutes((taskToEdit.duration / 60).toString());
      setRecurrentTimeInMinutes((taskToEdit.recurrentTime / 60).toString());
    }
  }, [taskToEdit]);

  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      duration?: string;
      recurrentTime?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = "Task name is required";
    }

    const durationValue = parseFloat(durationInMinutes);
    if (isNaN(durationValue) || durationValue <= 0) {
      newErrors.duration = "Duration must be a positive number";
    }

    const recurrentValue = parseFloat(recurrentTimeInMinutes);
    if (isNaN(recurrentValue) || recurrentValue < 0) {
      newErrors.recurrentTime = "Recurrent time must be a non-negative number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const taskData: Task = {
      id: taskToEdit ? taskToEdit.id : Date.now().toString(),
      name: name.trim(),
      duration: Math.floor(parseFloat(durationInMinutes) * 60), // Convert to seconds
      recurrentTime: Math.floor(parseFloat(recurrentTimeInMinutes) * 60), // Convert to seconds
      notificationSound,
      completionSound,
    };

    if (taskToEdit && onEditTask) {
      onEditTask(taskData);
    } else {
      onAddTask(taskData);
    }

    resetForm();
    setIsOpen(false);
  };

  const resetForm = () => {
    if (!taskToEdit) {
      setName("");
      setDurationInMinutes("10");
      setRecurrentTimeInMinutes("3");
    }
    setErrors({});
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button
          className={taskToEdit ? "w-full sm:w-auto" : "w-full"}
          size={taskToEdit ? "sm" : "lg"}
        >
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-md w-[95%] p-4 md:p-6">
        <DialogHeader>
          <DialogTitle>{taskToEdit ? "Edit Task" : "Add New Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Task Name
            </label>
            <Input
              id="name"
              placeholder="e.g., Shower, Exercise, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="duration" className="text-sm font-medium">
              Duration (minutes)
            </label>
            <Input
              id="durationMinutes"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="Duration in minutes"
              value={durationInMinutes}
              onChange={(e) => setDurationInMinutes(e.target.value)}
            />
            {errors.duration && (
              <p className="text-sm text-red-500">{errors.duration}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="recurrentTime" className="text-sm font-medium">
              Notification Interval (minutes)
            </label>
            <Input
              id="recurrentTimeMinutes"
              type="number"
              min="0"
              step="0.1"
              placeholder="Notification interval in minutes"
              value={recurrentTimeInMinutes}
              onChange={(e) => setRecurrentTimeInMinutes(e.target.value)}
            />
            {errors.recurrentTime && (
              <p className="text-sm text-red-500">{errors.recurrentTime}</p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Set to 0 to disable periodic notifications
            </p>
          </div>

          <div className="text-sm text-slate-500 dark:text-slate-400 p-2 bg-slate-100 dark:bg-slate-800 rounded-md">
            <p>
              Using Guitar sound for all notifications and task completions.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {taskToEdit ? "Save Changes" : "Add Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
