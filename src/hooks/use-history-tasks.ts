import { useCallback, useEffect, useState } from 'react';
import type { HistoryResultItem, HistorySelection, HistoryTaskItem } from '@/types';

export function useHistoryTasks() {
  const [items, setItems] = useState<HistoryTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedHistorySelection, setSelectedHistorySelection] = useState<HistorySelection | null>(null);
  const [selectedHistoryTask, setSelectedHistoryTask] = useState<HistoryTaskItem | null>(null);
  const [selectedHistoryResult, setSelectedHistoryResult] = useState<HistoryResultItem | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsErrorMessage, setDetailsErrorMessage] = useState('');

  const selectHistory = useCallback((selection: HistorySelection) => {
    setSelectedHistorySelection(selection);
  }, []);

  const loadHistory = useCallback(async ({ withLoadingIndicator }: { withLoadingIndicator: boolean }) => {
    if (withLoadingIndicator) {
      setIsLoading(true);
    }

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
      if (withLoadingIndicator) {
        setIsLoading(false);
      }
    }
  }, []);

  const reloadHistory = useCallback(async () => {
    await loadHistory({ withLoadingIndicator: false });
  }, [loadHistory]);

  useEffect(() => {
    const loadInitialHistory = async () => {
      await loadHistory({ withLoadingIndicator: true });
    };

    void loadInitialHistory();
  }, [loadHistory]);

  useEffect(() => {
    const selection = selectedHistorySelection;
    if (!selection) {
      setSelectedHistoryTask(null);
      setSelectedHistoryResult(null);
      setDetailsErrorMessage('');
      setIsDetailsLoading(false);

      return;
    }

    const abortController = new AbortController();

    const loadHistoryItem = async () => {
      setSelectedHistoryTask(null);
      setSelectedHistoryResult(null);
      setDetailsErrorMessage('');
      setIsDetailsLoading(true);

      try {
        const response = await fetch('/api/workflows/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selection.taskId }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null) as { message?: string } | null;
          setDetailsErrorMessage(errorData?.message ?? 'Не удалось загрузить результат записи');

          return;
        }

        const data = await response.json() as HistoryTaskItem;
        const result = data.results.find((item) => item.id === selection.resultId) ?? null;

        if (!result) {
          setDetailsErrorMessage('Файл результата не найден в выбранной задаче.');

          return;
        }

        setSelectedHistoryTask(data);
        setSelectedHistoryResult(result);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setDetailsErrorMessage(error instanceof Error ? error.message : 'Не удалось загрузить результат записи');
      } finally {
        if (!abortController.signal.aborted) {
          setIsDetailsLoading(false);
        }
      }
    };

    void loadHistoryItem();

    return () => {
      abortController.abort();
    };
  }, [selectedHistorySelection]);

  return {
    items,
    isLoading,
    errorMessage,
    selectedHistorySelection,
    selectHistory,
    reloadHistory,
    selectedHistoryTask,
    selectedHistoryResult,
    isDetailsLoading,
    detailsErrorMessage,
  };
}
