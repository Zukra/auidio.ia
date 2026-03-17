'use client';

import { useCallback, useRef, useState } from 'react';
import { Header } from '@/components/Header';
import { FormPanel } from '@/components/FormPanel';
import { ResultWorkspace } from '@/components/ResultWorkspace';
import type { AudioProcessResponse, AudioProcessStreamEvent, ExecutionState, FormRunPayload, ProcessingStep } from '@/types';

import './AudioTaskPage.module.css';

export function AudioTaskPage() {
  const [steps, setSteps] = useState<ProcessingStep[]>([]);
  const [execution, setExecution] = useState<ExecutionState>({ status: 'idle', response: null });
  const [activeResultTab, setActiveResultTab] = useState('result');
  const runIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleRun = useCallback(async ({ payload, upload }: FormRunPayload) => {
    runIdRef.current += 1;
    const currentRun = runIdRef.current;
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setExecution({ status: 'processing', response: null, errorMessage: undefined });
    setActiveResultTab('result');
    setSteps([]);

    try {
      const response = await fetch('/api/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Не удалось запустить обработку файла');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let requestId = '';
      let details: AudioProcessResponse['details'] | null = null;
      let resultText = '';
      let currentSteps: ProcessingStep[] = [];

      const applyStepUpdate = (step: ProcessingStep) => {
        const hasStep = currentSteps.some((current) => current.id === step.id);
        if (!hasStep) {
          currentSteps = [...currentSteps, step];
          return;
        }

        currentSteps = currentSteps.map((current) => current.id === step.id ? step : current);
      };

      const processEvent = (event: AudioProcessStreamEvent) => {
        if (runIdRef.current !== currentRun) {
          return;
        }

        if (event.type === 'workflow_started') {
          requestId = event.requestId;
          return;
        }

        if (event.type === 'step_update') {
          applyStepUpdate(event.step);
          setSteps([...currentSteps]);

          return;
        }

        if (event.type === 'result') {
          resultText = event.result;
          details = event.details;
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

        if (event.type === 'workflow_completed') {
          setExecution({
            status: 'completed',
            response: {
              requestId: event.requestId || requestId,
              steps: currentSteps,
              result: resultText,
              details: details ?? {
                taskType: payload.inputs.type_task,
                callbackUrl: payload.inputs.callback_url,
                userId: payload.inputs.user_id,
                fileName: upload.name || `upload:${payload.inputs.audio_file.upload_file_id}`,
                fileSizeKb: upload.size ? Math.round(upload.size / 1024) : undefined,
                finishedAt: new Date().toISOString(),
              },
            },
          });

          return;
        }

        if (event.type === 'error') {
          throw new Error(event.message);
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

          processEvent(JSON.parse(line) as AudioProcessStreamEvent);
        }
      }

      if (buffer.trim()) {
        processEvent(JSON.parse(buffer) as AudioProcessStreamEvent);
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
    }
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_52%,#f8fafc_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(58,95,104,0.22),_transparent_30%),linear-gradient(180deg,rgba(9,12,19,1)_0%,rgba(14,16,26,1)_100%)] dark:text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-2 px-4 py-4">

        <Header />

        <main className="grid flex-1 gap-2 md:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.15fr)] xl:grid-cols-[minmax(320px,520px)_minmax(0,1fr)]">
          <FormPanel onRun={handleRun} isProcessing={execution.status === 'processing'} />

          <ResultWorkspace
            execution={execution}
            activeTab={activeResultTab}
            onTabChange={setActiveResultTab}
            steps={steps}
          />
        </main>
      </div>
    </div>
  );
}
