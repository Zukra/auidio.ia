import { auth } from '@/features/auth/index.server';
import { runWorkflow } from '@/features/workflows/server';

export async function POST(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  const session = await auth();
  const data = { ...body, session };

  return runWorkflow(data);
}
