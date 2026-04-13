import type { ApiRecord, ProcessingStep } from '@/types';
import type { Session } from 'next-auth';

import {
  createTask,
  createTaskResult,
  findUserIdByAdLogin,
  setTaskStatus,
  setTaskStepStatus,
} from '@/features/workflows/server/workflow-task.repository';

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

function toRecord(value: unknown): ApiRecord {
  return value && typeof value === 'object' ? value as ApiRecord : {};
}

function toStringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function formatTaskName(taskType: string, startedAt: Date): string {
  const prefix = taskType || 'task';

  return `${prefix} ${startedAt.toLocaleString('ru-RU')}`;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runWorkflow(data: Record<string, unknown>): Promise<Response> {
  const dataRecord = toRecord(data);
  const session = <Session>dataRecord.session;

  const file = toRecord(dataRecord.file);
  const inputs = toRecord(dataRecord.inputs);
  const audioFile = toRecord(inputs.audio_file);
  const taskType = toStringValue(inputs.type_task) || toStringValue(inputs.task_type);
  const callbackUrl = toStringValue(inputs.callback_url);
  const userId = toStringValue(inputs.user_id) || session?.user?.id || '';
  const uploadFileId = toStringValue(audioFile.upload_file_id);
  const requestId = crypto.randomUUID();
  const startedAt = new Date();
  const steps = buildSteps();

  if (!userId) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const userIdFromDb = await findUserIdByAdLogin(userId);

  if (!userIdFromDb) {
    return new Response(JSON.stringify({ message: 'Пользователь не найден' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const taskId = await createTask({
    userId: userIdFromDb,
    name: formatTaskName(taskType, startedAt),
    taskType: taskType || 'unknown',
    createdAt: startedAt,
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const pushEvent = (event: ApiRecord) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      let currentStepName: string | null = null;

      try {
        await setTaskStatus(taskId, 'running');

        pushEvent({
          type: 'workflow_started',
          requestId,
          file,
          task_type: taskType,
          user_id: userId,
        });

        for (let index = 0; index < steps.length; index += 1) {
          const currentStep = steps[index];
          currentStepName = currentStep.title;

          await setTaskStepStatus(taskId, currentStep.title, 'running');

          pushEvent({
            type: 'step_update',
            step: { ...currentStep, status: 'running' },
            file,
            task_type: taskType,
            user_id: userId,
          });

          await wait(1000);

          await setTaskStepStatus(taskId, currentStep.title, 'success');

          pushEvent({
            type: 'step_update',
            step: { ...currentStep, status: 'success' },
            file,
            task_type: taskType,
            user_id: userId,
          });

          const nextStep = steps[index + 1];
          if (nextStep) {
            pushEvent({
              type: 'step_update',
              step: { ...nextStep, status: 'running' },
              file,
              task_type: taskType,
              user_id: userId,
            });
          }
        }

        const resultText = 'Обработка завершена. Файл принят в потоковую цепочку, речь распознана, а итоговый текст и сводка собраны в единый ответ.';
        const resultFile = toStringValue(file.name) || `upload:${uploadFileId}`;

        pushEvent({
          type: 'result',
          result: resultText,
          details: {
            taskType,
            callbackUrl,
            userId,
            fileName: `upload:${uploadFileId}`,
            fileSizeKb: undefined,
            finishedAt: new Date().toISOString(),
          },
          file,
          task_type: taskType,
          user_id: userId,
        });

        pushEvent({
          type: 'workflow_completed',
          requestId,
          file,
          task_type: taskType,
          user_id: userId,
        });

        await createTaskResult({ taskId, file: resultFile, result: resultText });
        await setTaskStatus(taskId, 'completed');
      } catch (error) {
        if (currentStepName) {
          await setTaskStepStatus(taskId, currentStepName, 'error').catch(() => undefined);
        }

        pushEvent({
          type: 'error',
          message: error instanceof Error ? error.message : 'Ошибка выполнения workflow',
          file,
          task_type: taskType,
          user_id: userId,
        });

        await setTaskStatus(taskId, 'failed', error instanceof Error ? error.message : 'Workflow failed');
      } finally {
        controller.close();
      }
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
