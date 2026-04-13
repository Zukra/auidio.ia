import { prisma } from '@/db/prisma';

type CreateTaskParams = {
  userId: number;
  name: string;
  taskType: string;
  createdAt: Date;
};

type CreateTaskResultParams = {
  taskId: number;
  file: string;
  result: string;
};

export async function findUserIdByAdLogin(adLogin: string): Promise<number | null> {
  const user = await prisma.user.findUnique({
    where: { adLogin },
    select: { id: true },
  });

  return user?.id ?? null;
}

export async function createTask(params: CreateTaskParams): Promise<number> {
  const task = await prisma.task.create({
    data: {
      userId: params.userId,
      name: params.name,
      taskType: params.taskType,
      status: 'created',
      createdAt: params.createdAt,
      errorMessage: null,
    },
    select: { id: true },
  });

  return task.id;
}

export async function setTaskStatus(taskId: number, status: string, errorMessage: string | null = null): Promise<void> {
  await prisma.task.update({
    where: { id: taskId },
    data: { status, errorMessage },
  });
}

export async function setTaskStepStatus(taskId: number, stepName: string, status: string): Promise<void> {
  await prisma.taskStep.upsert({
    where: { taskId_stepName: { taskId, stepName } },
    create: { taskId, stepName, status },
    update: { status },
  });
}

export async function createTaskResult(params: CreateTaskResultParams): Promise<void> {
  await prisma.taskResult.create({
    data: {
      taskId: params.taskId,
      file: params.file,
      result: params.result,
    },
  });
}
