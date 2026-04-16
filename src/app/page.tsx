'use client';

import { useMemo, useRef, useState } from 'react';
import { Header } from '@/components/header';
import { type TaskCreatePayload, TaskCreate } from '@/components/task/task-create';
import { TaskList } from '@/components/task/task-list';
import { TaskResult } from '@/components/task/task-result';
import type { TaskStatus } from '@/components/task/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TaskType } from '@/types';
import { Plus } from 'lucide-react';

type TaskItem = {
  id: number;
  title: string;
  taskType: TaskType;
  createdAt: string;
  updatedAt: string;
  status: TaskStatus;
  files: string[];
  result: string;
};

type ViewMode = 'create' | 'task';

const initialTasks: TaskItem[] = [
  {
    id: 1,
    title: 'Созвон с продуктовой командой',
    taskType: 'summary',
    createdAt: '2026-04-15T10:45:00.000Z',
    updatedAt: '2026-04-15T11:15:00.000Z',
    status: 'success',
    files: ['product_sync_15_04.wav', 'product_sync_summary.txt'],
    result: 'Резюме: приоритет на стабилизацию API, дедлайн по аналитике переносится на следующую неделю.',
  },
  {
    id: 2,
    title: 'Интервью кандидата backend',
    taskType: 'transcription',
    createdAt: '2026-04-14T16:10:00.000Z',
    updatedAt: '2026-04-14T16:35:00.000Z',
    status: 'running',
    files: ['backend_interview.wav'],
    result: 'Задача запущена. Результат появится после завершения обработки.',
  },
];

export default function Page() {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [viewMode, setViewMode] = useState<ViewMode>('create');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const nextTaskIdRef = useRef(Math.max(...initialTasks.map((task) => task.id)) + 1);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  );

  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [tasks],
  );

  const handleOpenCreate = () => {
    setViewMode('create');
    setSelectedTaskId(null);
  };

  const handleSelectTask = (taskId: number) => {
    setViewMode('task');
    setSelectedTaskId(taskId);
  };

  const handleCreateTask = ({ files, taskType }: TaskCreatePayload) => {
    if (files.length === 0) {
      return;
    }

    const nowIso = new Date().toISOString();
    const nextTasks: TaskItem[] = files.map((file) => {
      const taskId = nextTaskIdRef.current;
      nextTaskIdRef.current += 1;

      return {
        id: taskId,
        title: `Новая задача: ${file.name}`,
        taskType,
        createdAt: nowIso,
        updatedAt: nowIso,
        status: 'running',
        files: [file.name],
        result: 'Задача запущена. Результат появится после завершения обработки.',
      };
    });

    setTasks((current) => [...nextTasks, ...current]);
    setViewMode('create');
    setSelectedTaskId(null);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_52%,#f8fafc_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(58,95,104,0.22),_transparent_30%),linear-gradient(180deg,rgba(9,12,19,1)_0%,rgba(14,16,26,1)_100%)] dark:text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-2 px-4 py-4">
        <Header />

        <main className="grid min-h-0 flex-1 gap-2 md:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
          <Card className="h-full min-h-0 border-slate-200/80 bg-white/70 dark:border-white/8 dark:bg-white/[0.025]">
            <CardHeader className="pb-3">
              <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={handleOpenCreate}>
                <Plus className="size-4" />
                Новая задача
              </Button>
            </CardHeader>

            <CardContent className="min-h-0 px-2 pb-2">
              <TaskList
                tasks={sortedTasks}
                selectedTaskId={selectedTaskId}
                isTaskView={viewMode === 'task'}
                onSelectTask={handleSelectTask}
              />
            </CardContent>
          </Card>

          {viewMode === 'create' ? (
            <Card className="h-full border-slate-200/80 bg-white/70 dark:border-white/8 dark:bg-white/[0.025]">
              <CardHeader>
                <CardTitle className="text-base">Добавление задачи</CardTitle>
              </CardHeader>

              <CardContent>
                <TaskCreate onCreate={handleCreateTask} />
              </CardContent>
            </Card>
          ) : (
            <TaskResult task={selectedTask} />
          )}
        </main>
      </div>
    </div>
  );
}
