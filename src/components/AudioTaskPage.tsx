'use client';

import { useCallback, useRef, useState } from 'react';
import { Header } from '@/components/Header';
import { FormPanel } from '@/components/FormPanel';
import { ResultWorkspace } from '@/components/ResultWorkspace';

import './AudioTaskPage.module.css';

const initialStepTitles = [
  'НАЧАЛО',
  'КОНВЕРТЕР АУДИО',
  'ВЫВОД 2',
  'ПЕРЕВОД АУДИО В ТЕКСТ',
  'ЕСЛИ/ИНАЧЕ',
  'ВЫЖИМКА',
  'ОБРАБОТКА',
  'ЕСЛИ/ИНАЧЕ 4',
  'ОТВЕТ',
] as const;

const baseResult = 'Александр из компании Станкотрейд представился и сообщил, что они занимаются подборкой и продажей служебных станков для металлообработки. Он спросил, с кем можно обсудить сотрудничество в этой сфере. В ответ уточнили, что они не являются заводом и у них нет металлообработки. Отметили, что компания продает металлопрокат, но сама не производит его. Разговор завершился благодарностями и прощанием.';

function buildInitialSteps(): ProcessingStep[] {
  return initialStepTitles.map((title, index) => ({
    id: `step-${index + 1}`,
    title,
    status: index === 0 ? 'success' : 'idle',
  }));
}

function createMockResponse(request: AudioProcessRequest, steps: ProcessingStep[]): AudioProcessResponse {
  return {
    requestId: crypto.randomUUID(),
    steps,
    result: baseResult,
    details: {
      taskType: request.typeTask,
      callbackUrl: request.callbackUrl,
      userId: request.userId,
      fileName: request.file?.name,
      fileSizeKb: request.file ? Math.round(request.file.size / 1024) : undefined,
      finishedAt: new Date().toISOString(),
    },
  };
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function AudioTaskPage() {
  const [steps, setSteps] = useState<ProcessingStep[]>(buildInitialSteps);
  const [execution, setExecution] = useState<ExecutionState>({ status: 'idle', response: null });
  const [activeResultTab, setActiveResultTab] = useState('result');
  const runIdRef = useRef(0);

  const handleRun = useCallback(async (request: AudioProcessRequest) => {
    runIdRef.current += 1;
    const currentRun = runIdRef.current;
    const stepDraft = buildInitialSteps();

    setExecution({ status: 'processing', response: null });
    setActiveResultTab('result');
    setSteps(stepDraft.map((step, index) => ({ ...step, status: index === 0 ? 'success' : index === 1 ? 'running' : 'idle' })));

    for (let index = 1; index < stepDraft.length; index += 1) {
      await wait(260);
      if (runIdRef.current !== currentRun) {
        return;
      }

      const updatedSteps: ProcessingStep[] = stepDraft.map((step, stepIndex) => {
        if (stepIndex < index) {
          return { ...step, status: 'success' };
        }
        if (stepIndex === index) {
          return { ...step, status: 'success' };
        }
        if (stepIndex === index + 1) {
          return { ...step, status: 'running' };
        }
        return { ...step, status: 'idle' };
      });

      if (index === stepDraft.length - 1) {
        updatedSteps[index] = { ...updatedSteps[index], status: 'success' };
      }

      setSteps(updatedSteps);
    }

    const finalizedSteps = stepDraft.map((step) => ({ ...step, status: 'success' as const }));
    const response = createMockResponse(request, finalizedSteps);

    if (runIdRef.current !== currentRun) {
      return;
    }

    setSteps(finalizedSteps);
    setExecution({ status: 'completed', response });
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
