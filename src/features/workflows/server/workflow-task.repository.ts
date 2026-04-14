import { prisma } from '@/db/prisma';
import type { Session } from 'next-auth';

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

function getSessionUserId(session: Session | null | undefined): string | null {
  const userId = session?.user?.id;

  return typeof userId === 'string' && userId.length > 0 ? userId : null;
}

function parseTaskId(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  if (typeof value === 'string') {
    const id = Number.parseInt(value, 10);

    return Number.isInteger(id) && id > 0 ? id : null;
  }

  return null;
}

export async function getUserHistory(data: Record<string, unknown>) {
  const session = data.session as Session | null | undefined;
  const adLogin = getSessionUserId(session);

  if (!adLogin) {
    return null;
  }

  const userId = await findUserIdByAdLogin(adLogin);
  if (!userId) {
    return null;
  }

  return prisma.task.findMany({
    where: { userId },
    include: {
      results: {
        orderBy: {
          id: 'desc',
        },
      },
    },
    orderBy: {
      id: 'desc',
    },
  });
}

export async function getUserDetailHistory(data: Record<string, unknown>) {
  const session = data.session as Session | null | undefined;
  const adLogin = getSessionUserId(session);
  if (!adLogin) {
    return null;
  }

  const userId = await findUserIdByAdLogin(adLogin);
  if (!userId) {
    return null;
  }

  const taskId = parseTaskId(data.id);
  if (!taskId) {
    return null;
  }

  return prisma.task.findFirst({
    where: { id: taskId, userId },
    include: {
      results: {
        orderBy: {
          id: 'desc',
        },
      },
    },
  });
}
