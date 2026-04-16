import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { LoaderCircle, Play, Upload, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TaskType } from '@/types';

type TaskCreateStatus = 'pending' | 'queued';

type TaskCreateItem = {
  id: string;
  file: File;
  status: TaskCreateStatus;
};

export type TaskCreatePayload = {
  files: File[];
  taskType: TaskType;
};

type TaskCreateProps = {
  onCreate: (payload: TaskCreatePayload) => void;
};

const taskOptions: { value: TaskType; label: string }[] = [
  { value: 'summary', label: 'summary' },
  { value: 'transcription', label: 'transcription' },
  { value: 'transcription & summary', label: 'transcription & summary' },
];

function buildFileId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function formatFileSize(size: number): string {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function getStatusLabel(status: TaskCreateStatus): string {
  if (status === 'queued') {
    return 'Добавлен в задачи';
  }

  return 'Готов к запуску';
}

export function TaskCreate({ onCreate }: TaskCreateProps) {
  const [items, setItems] = useState<TaskCreateItem[]>([]);
  const [taskType, setTaskType] = useState<TaskType>('summary');
  const [isDragActive, setIsDragActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addFiles = (files: FileList | File[]) => {
    const nextFiles = Array.from(files);
    if (nextFiles.length === 0) {
      return;
    }

    setItems((current) => {
      const existingIds = new Set(current.map((item) => item.id));
      const uniqueItems = nextFiles
        .filter((file) => !existingIds.has(buildFileId(file)))
        .map((file) => ({
          id: buildFileId(file),
          file,
          status: 'pending' as const,
        }));

      return [...current, ...uniqueItems];
    });
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(event.target.files ?? []);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    addFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleRemove = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const handleClear = () => {
    setItems([]);
    setTaskType('summary');
  };

  const handleStart = () => {
    if (items.length === 0) {
      return;
    }

    setIsStarting(true);
    try {
      onCreate({ files: items.map((item) => item.file), taskType });
      setItems([]);
      setTaskType('summary');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-center gap-3">
        <Label className="shrink-0 text-sm font-medium text-slate-800 dark:text-zinc-100">task_type</Label>
        <Select value={taskType} onValueChange={(value) => setTaskType(value as TaskType)}>
          <SelectTrigger className="w-full bg-white/80 text-slate-800 dark:bg-white/[0.03] dark:text-zinc-200">
            <SelectValue placeholder="Выберите сценарий" />
          </SelectTrigger>
          <SelectContent className="border-slate-200 bg-white/95 text-slate-800 dark:border-white/10 dark:bg-[#171c29]/95 dark:text-zinc-100">
            {taskOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className="rounded-xl">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={[
          'rounded-2xl border border-dashed p-6 text-center transition-colors',
          isDragActive
            ? 'border-blue-300 bg-blue-50/70 dark:border-blue-500/50 dark:bg-blue-500/10'
            : 'border-slate-300/80 bg-white/60 dark:border-white/15 dark:bg-white/[0.02]',
        ].join(' ')}
      >
        <p className="text-sm font-medium text-slate-800 dark:text-zinc-100">Перетащите файлы сюда</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">Можно выбрать сразу несколько аудиофайлов</p>

        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-slate-200 bg-white/80 dark:border-white/10 dark:bg-white/[0.03]"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-4" />
            Выбрать файлы
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.wav,.mp3,.m4a"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-xl"
          disabled={items.length === 0 || isStarting}
          onClick={handleClear}
        >
          Очистить
        </Button>
        <Button
          type="button"
          className="h-9 rounded-xl bg-blue-600 text-white hover:bg-blue-500"
          disabled={items.length === 0 || isStarting}
          onClick={handleStart}
        >
          {isStarting ? <LoaderCircle className="size-4 animate-spin" /> : <Play className="size-4" />}
          Старт
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/60 p-2 dark:border-white/10 dark:bg-white/[0.02]">
        {items.length === 0 ? (
          <div className="flex h-full min-h-28 items-center justify-center text-sm text-slate-500 dark:text-zinc-500">
            Список файлов пуст
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-zinc-100">{item.file.name}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-500">{formatFileSize(item.file.size)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500 dark:text-zinc-400">{getStatusLabel(item.status)}</p>
                  {!isStarting && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg"
                      onClick={() => handleRemove(item.id)}
                    >
                      <XCircle className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
