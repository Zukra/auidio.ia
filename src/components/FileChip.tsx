import * as React from 'react';
import { Button } from '@/components/ui/button';
import { FileAudio, Trash2 } from 'lucide-react';

type Props = {
  fileView: FileView | null; onRemove: () => void
};
export const FileChip = ({ fileView, onRemove }: Props) => {
  if (!fileView) {
    return (
      <div className="flex h-[58px] items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-4 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-zinc-500">
        Выберите аудиофайл для обработки
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-pink-500/20 text-pink-300">
          <FileAudio className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">{fileView.name}</p>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-500">{fileView.extension} · {fileView.sizeLabel}</p>
        </div>
      </div>
      <Button type="button" variant="ghost" size="icon" className="rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-500 dark:hover:bg-white/[0.05] dark:hover:text-white" onClick={onRemove}>
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
};