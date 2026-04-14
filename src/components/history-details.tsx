import { useEffect, useState } from 'react';
import { Copy, FileAudio2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { OutputBox } from '@/components/output-box';
import type { HistoryResultItem, HistoryTaskItem } from '@/types';

type HistoryDetailsProps = {
  selectedHistoryItemId: string | null;
};

type HistorySelection = {
  taskId: number;
  resultId: number;
};

function parseSelection(value: string | null): HistorySelection | null {
  if (!value) {
    return null;
  }

  const [taskIdRaw, resultIdRaw] = value.split(':');
  const taskId = Number.parseInt(taskIdRaw ?? '', 10);
  const resultId = Number.parseInt(resultIdRaw ?? '', 10);

  if (!Number.isInteger(taskId) || taskId <= 0 || !Number.isInteger(resultId) || resultId <= 0) {
    return null;
  }

  return { taskId, resultId };
}

export const HistoryDetails = ({ selectedHistoryItemId }: HistoryDetailsProps) => {
  const [historyTask, setHistoryTask] = useState<HistoryTaskItem | null>(null);
  const [selectedResult, setSelectedResult] = useState<HistoryResultItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const selection = parseSelection(selectedHistoryItemId);
    if (!selection) {
      setHistoryTask(null);
      setSelectedResult(null);
      setErrorMessage('');
      setIsLoading(false);

      return;
    }

    const abortController = new AbortController();

    const loadHistoryItem = async () => {
      setHistoryTask(null);
      setSelectedResult(null);
      setErrorMessage('');
      setIsLoading(true);

      try {
        const response = await fetch('/api/workflows/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selection.taskId }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null) as { message?: string } | null;
          setErrorMessage(errorData?.message ?? 'Не удалось загрузить результат записи');

          return;
        }

        const data = await response.json() as HistoryTaskItem;
        const result = data.results.find((item) => item.id === selection.resultId) ?? null;

        if (!result) {
          setErrorMessage('Файл результата не найден в выбранной задаче.');

          return;
        }

        setHistoryTask(data);
        setSelectedResult(result);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : 'Не удалось загрузить результат записи');
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadHistoryItem();

    return () => {
      abortController.abort();
    };
  }, [selectedHistoryItemId]);

  return (
    <Card className="flex-1 border-slate-200/80 bg-white/70 dark:border-white/8 dark:bg-white/[0.025]">
      <CardContent className="flex h-full flex-col p-4">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-white/8">
          РЕЗУЛЬТАТ
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!selectedResult}
            className="rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-500 dark:hover:bg-white/[0.05] dark:hover:text-white"
            onClick={() => navigator.clipboard.writeText(selectedResult?.result ?? '')}
          >
            <Copy className="size-4" />
          </Button>
        </div>

        <div className="mt-0 flex-1">
          <OutputBox>
            {isLoading ? (
              <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 text-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-zinc-100">
                    Загружаем результат
                  </p>
                  <p className="text-sm text-slate-500 dark:text-zinc-500">
                    Получаем данные выбранного файла из истории.
                  </p>
                </div>
              </div>
            ) : selectedResult ? (
              <>
                <p className="mb-3 text-sm text-slate-500 dark:text-zinc-500">
                  {historyTask?.name} / {selectedResult.file}
                </p>
                <p className="leading-8 text-slate-800 dark:text-zinc-100">
                  {selectedResult.result}
                </p>
              </>
            ) : (
              <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-white/[0.05] dark:text-zinc-400">
                  <FileAudio2 className="size-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-zinc-100">
                    {errorMessage ? 'Не удалось загрузить историю' : 'Выберите файл из истории'}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-zinc-500">
                    {errorMessage || 'Результат выбранного файла появится здесь.'}
                  </p>
                </div>
              </div>
            )}
          </OutputBox>
        </div>
      </CardContent>
    </Card>
  );
};
