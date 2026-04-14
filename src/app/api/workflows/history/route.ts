import { auth } from '@/features/auth/index.server';
import { NextResponse } from 'next/server';
import { getUserDetailHistory, getUserHistory } from '@/features/workflows/server/workflow-task.repository';

type HistoryRequestBody = {
  id?: string | number;
};

export async function POST(request: Request) {
  let body: HistoryRequestBody = {};

  try {
    body = await request.json() as HistoryRequestBody;
  } catch {
    body = {};
  }

  const session = await auth();

  if (!body.id) {
    const tasks = await getUserHistory({ ...body, session });

    return NextResponse.json(tasks ?? [], { status: 200 });
  }

  const task = await getUserDetailHistory({ ...body, session });

  if (!task) {
    return NextResponse.json({ message: 'Запись истории не найдена' }, { status: 404 });
  }

  return NextResponse.json(task, { status: 200 });
}
