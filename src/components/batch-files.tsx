import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { CheckCircle2, LoaderCircle, Upload, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AudioUploadResponse } from '@/types';

type BatchUploadStatus = 'pending' | 'uploading' | 'uploaded' | 'error';

type BatchUploadItem = {
  id: string;
  file: File;
  status: BatchUploadStatus;
  uploadId: string;
  errorMessage: string;
};

function buildFileId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function toStringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function formatFileSize(size: number): string {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function getStatusText(item: BatchUploadItem): string {
  if (item.status === 'uploading') {
    return 'Загружается...';
  }

  if (item.status === 'uploaded') {
    return `Загружен, id: ${item.uploadId}`;
  }

  if (item.status === 'error') {
    return item.errorMessage || 'Ошибка загрузки';
  }

  return 'Готов к загрузке';
}

export function BatchFiles() {
  const [items, setItems] = useState<BatchUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addFiles = (files: FileList | File[]) => {
    const nextFiles = Array.from(files);
    if (nextFiles.length === 0) {
      return;
    }

    setItems((current) => {
      const currentIds = new Set(current.map((item) => item.id));
      const unique = nextFiles
        .filter((file) => !currentIds.has(buildFileId(file)))
        .map((file) => ({
          id: buildFileId(file),
          file,
          status: 'pending' as const,
          uploadId: '',
          errorMessage: '',
        }));

      return [...current, ...unique];
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

  const updateItem = (id: string, updater: (item: BatchUploadItem) => BatchUploadItem) => {
    setItems((current) => current.map((item) => item.id === id ? updater(item) : item));
  };

  const uploadOne = async (item: BatchUploadItem) => {
    updateItem(item.id, (current) => ({ ...current, status: 'uploading', errorMessage: '' }));

    try {
      const formData = new FormData();
      formData.append('file', item.file);

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Не удалось загрузить файл');
      }

      const data = await response.json() as AudioUploadResponse;

      updateItem(item.id, (current) => ({
        ...current,
        status: 'uploaded',
        uploadId: toStringValue(data.id),
        errorMessage: '',
      }));
    } catch (error) {
      updateItem(item.id, (current) => ({
        ...current,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Не удалось загрузить файл',
      }));
    }
  };

  const handleUploadAll = async () => {
    const queue = items.filter((item) => item.status !== 'uploaded');
    if (queue.length === 0) {
      return;
    }

    setIsUploading(true);
    try {
      await Promise.all(queue.map((item) => uploadOne(item)));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const handleClear = () => {
    setItems([]);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
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
        <p className="text-sm font-medium text-slate-800 dark:text-zinc-100">
          Перетащите файлы сюда
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
          Можно выбрать сразу несколько аудиофайлов
        </p>

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

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-xl"
            disabled={items.length === 0 || isUploading}
            onClick={handleClear}
          >
            Очистить
          </Button>
          <Button
            type="button"
            className="h-9 rounded-xl bg-blue-600 text-white hover:bg-blue-500"
            disabled={items.length === 0 || isUploading}
            onClick={handleUploadAll}
          >
            {isUploading ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Загрузить все
          </Button>
        </div>
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
                  <p className="text-xs text-slate-500 dark:text-zinc-400">{getStatusText(item)}</p>
                  {item.status === 'uploaded' && <CheckCircle2 className="size-4 text-emerald-500" />}
                  {item.status === 'error' && <XCircle className="size-4 text-rose-500" />}
                  {item.status !== 'uploading' && (
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
