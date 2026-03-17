import { NextResponse } from 'next/server';
import { mockHistoryItems } from '@/lib/mock-history';

type HistoryRequestBody = {
  id?: string;
};

export async function POST(request: Request) {
  let body: HistoryRequestBody = {};

  try {
    body = await request.json() as HistoryRequestBody;
  } catch {
    body = {};
  }

  if (!body.id) {
    return NextResponse.json(mockHistoryItems, { status: 200 });
  }

  const historyItem = mockHistoryItems.find((item) => item.id === body.id);

  if (!historyItem) {
    return NextResponse.json({ message: 'Запись истории не найдена' }, { status: 404 });
  }

  return NextResponse.json(historyItem, { status: 200 });
}
