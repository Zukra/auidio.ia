import { Plan, PlanAction, PlanContent, PlanDescription, PlanHeader, PlanTitle } from '@/components/ai-elements/plan';
import type { TaskStatus } from '@/components/task/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { TaskType } from '@/types';
import { Sparkles } from 'lucide-react';

type TaskResultItem = {
  title: string;
  taskType: TaskType;
  updatedAt: string;
  status: TaskStatus;
  result: string;
};

type TaskResultProps = {
  task: TaskResultItem | null;
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

export function TaskResult({ task }: TaskResultProps) {
  return (
    <Card className="h-full min-h-0 border-slate-200/80 bg-white/70 dark:border-white/8 dark:bg-white/[0.025]">
      <CardHeader>
        <CardTitle className="text-base">{task?.title ?? 'Результаты задачи'}</CardTitle>
      </CardHeader>

      <CardContent className="min-h-0">
        {!task ? (
          <div className="rounded-xl border border-dashed border-slate-200/80 p-6 text-sm text-slate-500 dark:border-white/10 dark:text-zinc-500">
            Выберите задачу в левом списке.
          </div>
        ) : (
          <div className="min-h-0 rounded-xl border border-slate-200/80 p-4 dark:border-white/10">
            <Plan defaultOpen={true} isStreaming={task.status === 'running'} className="border-none bg-transparent shadow-none">
              <PlanHeader className="px-0 pt-0">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="size-4 text-slate-500 dark:text-zinc-400" />
                    <PlanTitle className="text-sm">Результат задачи</PlanTitle>
                  </div>
                  <PlanDescription className="text-xs">
                    {`task_type: ${task.taskType} • Обновлено: ${formatDate(task.updatedAt)}`}
                  </PlanDescription>
                </div>
                <PlanAction>
                  <span className={cn('rounded-md px-2 py-1 text-xs font-medium', getStatusClassName(task.status))}>
                    {getStatusLabel(task.status)}
                  </span>
                </PlanAction>
              </PlanHeader>
              <PlanContent className="px-0 pb-0">
                <div className="h-[calc(100vh-19rem)] overflow-y-auto rounded-lg border border-slate-200/80 p-3 dark:border-white/10">
                  <p className="whitespace-pre-wrap leading-7 text-slate-800 dark:text-zinc-100">{task.result}</p>
                </div>
              </PlanContent>
            </Plan>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
