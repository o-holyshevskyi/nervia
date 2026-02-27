import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

export async function GET() {
  const extensionDir = path.join(process.cwd(), 'chrome-extension');

  if (!fs.existsSync(extensionDir) || !fs.statSync(extensionDir).isDirectory()) {
    return NextResponse.json({ error: 'Extension not found' }, { status: 404 });
  }

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.directory(extensionDir, false);
  archive.finalize();

  const webStream = Readable.toWeb(archive) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="synapse-clipper.zip"',
    },
  });
}
