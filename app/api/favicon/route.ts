import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get('domain');

  if (!domain) {
    return new Response('Missing domain', { status: 400 });
  }

  const cleanDomain = domain.replace(/^www\./, '');

  const sources = [
    `https://logo.clearbit.com/${cleanDomain}`,
    `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=64`,
  ];

  for (const url of sources) {
    try {
      const res = await fetch(url, {
        headers: {
          // Some providers require a User-Agent
          'User-Agent': 'Mozilla/5.0',
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const buffer = await res.arrayBuffer();

        return new Response(buffer, {
          headers: {
            'Content-Type': res.headers.get('content-type') ?? 'image/png',
            'Cache-Control': 'public, max-age=86400',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    } catch (err) {
      console.warn('Favicon source failed:', url);
    }
  }

  // If everything fails → return 204 instead of 500
  return new Response(null, { status: 204 });
}