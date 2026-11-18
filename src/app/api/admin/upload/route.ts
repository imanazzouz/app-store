import{canManagePropertyOperations}from'@/lib/permissions';
import path from 'node:path';
import fs from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSession, originAllowed } from '@/lib/session';

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

/**
 * Photo upload for listings.
 *  - Production: streams to Vercel Blob when BLOB_READ_WRITE_TOKEN is present.
 *  - Local dev:  saves into public/uploads so the workflow can be tested offline.
 */
export async function POST(req: Request) {
  const session=await getSession();
  if(!session)return NextResponse.json({error:'يرجى تسجيل الدخول أولاً.'},{status:401});if(!canManagePropertyOperations(session.role))return NextResponse.json({error:'ليست لديك صلاحية تنفيذ هذه العملية.'},{status:403});
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  if (!originAllowed(req)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file received.' }, { status: 400 });
  }
  if (!ALLOWED[file.type]) {
    return NextResponse.json(
      { error: 'Please upload a JPG, PNG, WEBP or AVIF image.' },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image is larger than 6 MB.' }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  const filename = `${Date.now()}-${randomBytes(3).toString('hex')}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  // 1) Vercel Blob (production path)
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    try {
      const { put } = await import('@vercel/blob');
      const blob = await put(`listings/${filename}`, bytes, {
        access: 'public',
        token,
        contentType: file.type,
      });
      return NextResponse.json({ ok: true, url: blob.url });
    } catch (err) {
      return NextResponse.json(
        { error: `Upload failed: ${err instanceof Error ? err.message : 'unknown error'}` },
        { status: 502 },
      );
    }
  }

  // 2) Local filesystem (development only)
  try {
    const dir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), bytes);
    return NextResponse.json({ ok: true, url: `/uploads/${filename}` });
  } catch {
    return NextResponse.json(
      {
        error:
          'File uploads are not configured on this deployment. Attach a Vercel Blob store, or paste an image URL instead.',
      },
      { status: 400 },
    );
  }
}
