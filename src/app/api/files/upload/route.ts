import { NextResponse } from 'next/server';
import type { AudioUploadResponse } from '@/types';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ message: 'Файл не передан' }, { status: 400 });
  }

  return NextResponse.json({
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    extension: file.name.split('.').at(-1) ?? '',
    mime_type: file.type || 'application/octet-stream',
    created_by: crypto.randomUUID(),
    created_at: Math.floor(Date.now() / 1000),
    preview_url: null,
    source_url: '',
  } satisfies AudioUploadResponse, { status: 201 });
}
