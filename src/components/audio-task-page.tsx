'use client';

import { useCallback, useRef, useState } from 'react';
import { Header } from '@/components/header';
import { FormPanel } from '@/components/form-panel';
import { HistoryDetails } from '@/components/history-details';
import { ResultWorkspace } from '@/components/result-workspace';
import { useHistoryTasks } from '@/hooks/use-history-tasks';
import type { ApiRecord, ExecutionState, FormRunPayload, LaunchMode, ProcessingStep } from '@/types';

import './audio-task-page.module.css';

function toRecord(value: unknown): ApiRecord {
  return value && typeof value === 'object' ? value as ApiRecord : {};
}

function toStringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toNumberValue(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function toStep(value: unknown): ProcessingStep | null {
  const record = toRecord(value);
  const id = toStringValue(record.id);
  const title = toStringValue(record.title);
  const status = toStringValue(record.status);

  if (!id || !title || (status !== 'idle' && status !== 'running' && status !== 'success' && status !== 'error')) {
    return null;
  }

  return { id, title, status };
}

export function AudioTaskPage() {
  const [steps, setSteps] = useState<ProcessingStep[]>([]);
  const [execution, setExecution] = useState<ExecutionState>({ status: 'idle', response: null });
  const [launchMode, setLaunchMode] = useState<LaunchMode>('single');
  const runIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const {
    items: historyItems,
    isLoading: isHistoryLoading,
    errorMessage: historyErrorMessage,
    selectedHistorySelection,
    selectHistory,
    reloadHistory,
    selectedHistoryTask,
    selectedHistoryResult,
    isDetailsLoading: isHistoryDetailsLoading,
    detailsErrorMessage: historyDetailsErrorMessage,
  } = useHistoryTasks();

  const handleRun = useCallback(async ({ payload, upload }: FormRunPayload) => {
    runIdRef.current += 1;
    const currentRun = runIdRef.current;
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setExecution({ status: 'processing', response: null, errorMessage: undefined });
    setSteps([]);

    try {
      const response = await fetch('/api/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, ...{ file: upload } }),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Не удалось запустить обработку файла');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let requestId = '';
      let details: ApiRecord | null = null;
      let resultText = '';
      let currentSteps: ProcessingStep[] = [];
      const payloadRecord = toRecord(payload);
      const payloadInputs = toRecord(payloadRecord.inputs);
      const payloadAudioFile = toRecord(payloadInputs.audio_file);
      const uploadRecord = toRecord(upload);

      const applyStepUpdate = (step: ProcessingStep) => {
        const hasStep = currentSteps.some((current) => current.id === step.id);
        if (!hasStep) {
          currentSteps = [...currentSteps, step];

          return;
        }

        currentSteps = currentSteps.map((current) => current.id === step.id ? step : current);
      };

      const processEvent = (event: ApiRecord) => {
        if (runIdRef.current !== currentRun) {
          return;
        }

        const eventType = toStringValue(event.type);

        if (eventType === 'workflow_started') {
          requestId = toStringValue(event.requestId);
          void reloadHistory();

          return;
        }

        if (eventType === 'step_update') {
          const nextStep = toStep(event.step);
          if (!nextStep) {
            return;
          }
          applyStepUpdate(nextStep);
          setSteps([...currentSteps]);

          return;
        }

        if (eventType === 'result') {
          resultText = toStringValue(event.result);
          details = toRecord(event.details);
          setExecution({
            status: 'processing',
            response: {
              requestId,
              steps: currentSteps,
              result: resultText,
              details,
            },
          });

          return;
        }

        if (eventType === 'workflow_completed') {
          const uploadName = toStringValue(uploadRecord.name);
          const uploadSize = toNumberValue(uploadRecord.size);
          const payloadUploadFileId = toStringValue(payloadAudioFile.upload_file_id);

          setExecution({
            status: 'completed',
            response: {
              requestId: toStringValue(event.requestId) || requestId,
              steps: currentSteps,
              result: resultText,
              details: details ?? {
                taskType: toStringValue(payloadInputs.task_type),
                callbackUrl: toStringValue(payloadInputs.callback_url),
                userId: toStringValue(payloadInputs.user_id),
                fileName: uploadName || `upload:${payloadUploadFileId}`,
                fileSizeKb: uploadSize ? Math.round(uploadSize / 1024) : undefined,
                finishedAt: new Date().toISOString(),
              },
            },
          });
          void reloadHistory();

          return;
        }

        if (eventType === 'error') {
          throw new Error(toStringValue(event.message) || 'Ошибка при обработке файла');
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) {
            continue;
          }

          processEvent(toRecord(JSON.parse(line) as unknown));
        }
      }

      if (buffer.trim()) {
        processEvent(toRecord(JSON.parse(buffer) as unknown));
      }
    } catch (error) {
      if (abortController.signal.aborted || runIdRef.current !== currentRun) {
        return;
      }

      setExecution({
        status: 'error',
        response: null,
        errorMessage: error instanceof Error ? error.message : 'Ошибка при обработке файла',
      });

      setSteps((current) => current.map((step) => step.status === 'running' ? { ...step, status: 'error' } : step));
      void reloadHistory();
    }
  }, [reloadHistory]);

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_52%,#f8fafc_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(58,95,104,0.22),_transparent_30%),linear-gradient(180deg,rgba(9,12,19,1)_0%,rgba(14,16,26,1)_100%)] dark:text-foreground">
      <div className="mx-auto flex h-full w-full max-w-[1440px] flex-col gap-2 px-4 py-4">

        <Header />

        <main className="grid min-h-0 flex-1 gap-2 md:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.15fr)] xl:grid-cols-[minmax(320px,520px)_minmax(0,1fr)]">
          <FormPanel
            onRun={handleRun}
            isProcessing={execution.status === 'processing'}
            launchMode={launchMode}
            onLaunchModeChange={setLaunchMode}
            historyItems={historyItems}
            isHistoryLoading={isHistoryLoading}
            historyErrorMessage={historyErrorMessage}
            selectedHistorySelection={selectedHistorySelection}
            onHistorySelect={selectHistory}
          />

          {launchMode === 'history'
            ? (
              <HistoryDetails
                historyTask={selectedHistoryTask}
                historyResult={selectedHistoryResult}
                isLoading={isHistoryDetailsLoading}
                errorMessage={historyDetailsErrorMessage}
              />
            )
            : (
              <ResultWorkspace execution={execution} steps={steps} />
            )}
        </main>
      </div>
    </div>
  );
}
