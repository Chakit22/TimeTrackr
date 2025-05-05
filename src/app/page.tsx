import { TaskList } from "@/components/task-list";
import { AudioInitializer } from "@/components/audio-initializer";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <AudioInitializer />
      <TaskList />
    </main>
  );
}
