import { useEffect, useState } from 'react';
import type { HistoryItem } from '@/types';
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

export const History = ({ selectedHistoryItemId, onSelect }: HistoryProps) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await fetch('/api/files/history', { method: 'POST' });

        if (!response.ok) {
          throw new Error('Не удалось загрузить историю');
        }

        const data = await response.json() as HistoryItem[];
        setItems(data);
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
      <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(140px,0.9fr)_minmax(160px,1fr)] gap-4 border-b border-slate-200/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:border-white/10 dark:text-zinc-500">
        <span>Файл</span>
        <span>Дата</span>
        <span>Тип</span>
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
          {items.map((item) => {
            const isSelected = item.id === selectedHistoryItemId;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  'grid w-full grid-cols-[minmax(0,1.6fr)_minmax(140px,0.9fr)_minmax(160px,1fr)] gap-4 px-4 py-4 text-left transition-colors hover:bg-slate-100/80 dark:hover:bg-white/[0.05]',
                  isSelected && 'bg-blue-50/80 dark:bg-blue-500/10',
                )}
              >
                <span className="truncate text-sm font-semibold text-slate-800 dark:text-zinc-100">{item.fileName}</span>
                <span className="text-sm text-slate-500 dark:text-zinc-400">{formatHistoryDate(item.processedAt)}</span>
                <span className="text-sm text-slate-600 dark:text-zinc-300">{item.taskType}</span>
              </button>
            );
          })}
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
