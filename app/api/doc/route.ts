import { NextResponse } from 'next/server';
import { getApiDocs } from '@/src/lib/swagger';

export async function GET() {
  const spec = await getApiDocs();
  return NextResponse.json(spec);
}