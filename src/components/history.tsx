import { useEffect, useState } from 'react';
import type { HistoryTaskItem } from '@/types';
import { cn } from '@/lib/utils';

type HistoryProps = {
  selectedHistoryItemId: string | null;
  onSelect: (historyItemId: string) => void;
};

function formatHistoryDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function buildSelectionId(taskId: number, resultId: number): string {
  return `${taskId}:${resultId}`;
}

export const History = ({ selectedHistoryItemId, onSelect }: HistoryProps) => {
  const [items, setItems] = useState<HistoryTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await fetch('/api/workflows/history', { method: 'POST' });

        if (!response.ok) {
          setItems([]);
          setErrorMessage('Не удалось загрузить историю');

          return;
        }

        const data = await response.json() as HistoryTaskItem[] | null;
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        setItems([]);
        setErrorMessage(error instanceof Error ? error.message : 'Не удалось загрузить историю');
      } finally {
        setIsLoading(false);
      }
    };

    void loadHistory();
  }, []);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="border-b border-slate-200/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:border-white/10 dark:text-zinc-500">
        Запросы
      </div>

      {errorMessage && (
        <div className="border-b border-slate-200/80 px-4 py-3 text-xs text-rose-600 dark:border-white/10 dark:text-rose-300">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="px-4 py-6 text-sm text-slate-500 dark:text-zinc-500">
          Загружаем историю...
        </div>
      ) : (
        <div className="divide-y divide-slate-200/80 dark:divide-white/10">
          {items.map((task) => (
            <div key={task.id} className="px-4 py-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">{task.name}</p>
                <p className="shrink-0 text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-zinc-400">{task.taskType}</p>
              </div>

              {task.results.length > 0 ? (
                <div className="space-y-1">
                  {task.results.map((result) => {
                    const selectionId = buildSelectionId(task.id, result.id);
                    const isSelected = selectionId === selectedHistoryItemId;

                    return (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => onSelect(selectionId)}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition-colors hover:bg-slate-100/80 dark:hover:bg-white/[0.05]',
                          isSelected && 'border-blue-200 bg-blue-50/80 dark:border-blue-500/30 dark:bg-blue-500/10',
                        )}
                      >
                        <span className="truncate text-sm text-slate-800 dark:text-zinc-100">{result.file}</span>
                        <span className="shrink-0 text-xs text-slate-500 dark:text-zinc-400">{formatHistoryDate(result.updatedAt)}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200/80 px-3 py-2 text-sm text-slate-500 dark:border-white/10 dark:text-zinc-500">
                  Для этой задачи пока нет сохраненных файлов.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="px-4 py-6 text-sm text-slate-500 dark:text-zinc-500">
          История пока пуста.
        </div>
      )}
    </div>
  );
};
