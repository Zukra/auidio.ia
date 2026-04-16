import { Plan, PlanAction, PlanContent, PlanDescription, PlanHeader, PlanTitle, PlanTrigger } from '@/components/ai-elements/plan';
import { cn } from '@/lib/utils';
import type { TaskStatus } from '@/components/task/types';
import type { TaskType } from '@/types';
import { FileText } from 'lucide-react';

type TaskListItem = {
  id: number;
  title: string;
  taskType: TaskType;
  createdAt: string;
  status: TaskStatus;
  files: string[];
  result: string;
};

type TaskListProps = {
  tasks: TaskListItem[];
  selectedTaskId: number | null;
  isTaskView: boolean;
  onSelectTask: (taskId: number) => void;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function getStatusLabel(status: TaskStatus): string {
  if (status === 'running') {
    return 'В процессе';
  }
  if (status === 'error') {
    return 'Ошибка';
  }
  if (status === 'success') {
    return 'Готово';
  }

  return 'Ожидание';
}

function getStatusClassName(status: TaskStatus): string {
  if (status === 'running') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200';
  }
  if (status === 'error') {
    return 'bg-rose-100 text-rose-800 dark:bg-rose-400/20 dark:text-rose-200';
  }
  if (status === 'success') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-200';
  }

  return 'bg-slate-100 text-slate-700 dark:bg-zinc-700/40 dark:text-zinc-300';
}

export function TaskList({ tasks, selectedTaskId, isTaskView, onSelectTask }: TaskListProps) {
  return (
    <div className="h-[calc(100vh-12rem)] overflow-y-auto px-2">
      <div className="space-y-2">
        {tasks.map((task) => {
          const isActive = selectedTaskId === task.id && isTaskView;

          return (
            <Plan
              key={task.id}
              defaultOpen={false}
              onClick={() => onSelectTask(task.id)}
              className={cn(
                'cursor-pointer border transition-colors',
                isActive
                  ? 'border-blue-200 bg-blue-50/60 dark:border-blue-500/30 dark:bg-blue-500/10'
                  : 'border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/[0.02]',
              )}
              isStreaming={task.status === 'running'}
            >
              <PlanHeader>
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="size-4 text-slate-500 dark:text-zinc-400" />
                    <PlanTitle className="truncate text-sm">{task.title}</PlanTitle>
                  </div>
                  <PlanDescription className="text-xs">
                    {`${formatDate(task.createdAt)} • ${task.taskType}`}
                  </PlanDescription>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {task.files.map((fileName) => (
                      <span
                        key={fileName}
                        className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700 dark:bg-zinc-700/40 dark:text-zinc-300"
                      >
                        {fileName}
                      </span>
                    ))}
                  </div>
                </div>
                <PlanAction className="flex items-center gap-1">
                  <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-medium', getStatusClassName(task.status))}>
                    {getStatusLabel(task.status)}
                  </span>
                  <PlanTrigger />
                </PlanAction>
              </PlanHeader>
              <PlanContent>
                <p className="line-clamp-2 text-sm text-slate-700 dark:text-zinc-200">{task.result}</p>
              </PlanContent>
            </Plan>
          );
        })}
      </div>
    </div>
  );
}
