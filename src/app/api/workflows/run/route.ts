import type { AudioProcessPayload, AudioProcessStreamEvent, ProcessingStep } from '@/types';
 
const encoder = new TextEncoder();

const workflowStepTitles = [
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

function buildSteps(): ProcessingStep[] {
  return workflowStepTitles.map((title, index) => ({
    id: `step-${index + 1}`,
    title,
    status: index === 0 ? 'running' : 'idle',
  }));
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  const body = await request.json() as AudioProcessPayload;
  const requestId = crypto.randomUUID();
  const steps = buildSteps();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const pushEvent = (event: AudioProcessStreamEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      pushEvent({
        type: 'workflow_started',
        requestId,
      });

      for (let index = 0; index < steps.length; index += 1) {
        const currentStep = steps[index];

        pushEvent({
          type: 'step_update',
          step: { ...currentStep, status: 'running' },
        });

        await wait(500);

        pushEvent({
          type: 'step_update',
          step: { ...currentStep, status: 'success' },
        });

        const nextStep = steps[index + 1];
        if (nextStep) {
          pushEvent({
            type: 'step_update',
            step: { ...nextStep, status: 'running' },
          });
        }
      }

      pushEvent({
        type: 'result',
        result: 'Обработка завершена. Файл принят в потоковую цепочку, речь распознана, а итоговый текст и сводка собраны в единый ответ.',
        details: {
          taskType: body.inputs.type_task,
          callbackUrl: body.inputs.callback_url,
          userId: body.inputs.user_id,
          fileName: `upload:${body.inputs.audio_file.upload_file_id}`,
          fileSizeKb: undefined,
          finishedAt: new Date().toISOString(),
        },
      });

      pushEvent({
        type: 'workflow_completed',
        requestId,
      });

      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
