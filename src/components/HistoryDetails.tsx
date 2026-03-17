import { Copy, FileAudio2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { OutputBox } from '@/components/OutputBox';
import type { HistoryItem } from '@/types';

type HistoryDetailsProps = {
  historyItem: HistoryItem | null;
  isLoading?: boolean;
  errorMessage?: string;
};

export const HistoryDetails = ({ historyItem, isLoading = false, errorMessage }: HistoryDetailsProps) => {
  return (
    <Card className="flex-1 border-slate-200/80 bg-white/70 dark:border-white/8 dark:bg-white/[0.025]">
      <CardContent className="flex h-full flex-col p-4">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-white/8">
          РЕЗУЛЬТАТ
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-500 dark:hover:bg-white/[0.05] dark:hover:text-white"
            onClick={() => navigator.clipboard.writeText(historyItem?.result ?? '')}
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
                    Получаем данные выбранной записи из истории.
                  </p>
                </div>
              </div>
            ) : historyItem ? (
              <>
                <p className="mb-3 text-sm text-slate-500 dark:text-zinc-500">
                  {historyItem.fileName} / {historyItem.requestId}
                </p>
                <p className="leading-8 text-slate-800 dark:text-zinc-100">
                  {historyItem.result}
                </p>
              </>
            ) : (
              <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-white/[0.05] dark:text-zinc-400">
                  <FileAudio2 className="size-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-zinc-100">
                    {errorMessage ? 'Не удалось загрузить историю' : 'Выберите запись из истории'}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-zinc-500">
                    {errorMessage ?? 'Результат выбранного файла появится здесь.'}
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
