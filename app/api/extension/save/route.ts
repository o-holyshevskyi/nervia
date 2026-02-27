import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const EXTENSION_ORIGIN = 'chrome-extension://nfegmgojbdgmkphphhnkjonomeeffhkj';

const corsHeaders = {
  'Access-Control-Allow-Origin': EXTENSION_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    let user: { id: string } | null = null;
    let supabase: ReturnType<typeof createClient> | ReturnType<typeof createServerClient>;

    if (bearerToken) {
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${bearerToken}` } },
        }
      );
      const { data: { user: tokenUser } } = await supabase.auth.getUser(bearerToken);
      user = tokenUser;
    }

    if (!user) {
      const cookieStore = await cookies();
      supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {}
            },
          },
        }
      );
      const { data: { user: cookieUser } } = await supabase.auth.getUser();
      user = cookieUser;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Please log in to the Synapse web app first. Open the Synapse app in a tab and refresh, then try again.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { title, url, tags } = body as { title?: string; url?: string; tags?: string[] };

    if (!title || !url || typeof title !== 'string' || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid title or url' },
        { status: 400, headers: corsHeaders }
      );
    }

    const tagsArray = Array.isArray(tags) ? tags : [];

    const record = {
      id: crypto.randomUUID(),
      title,
      url,
      type: 'link',
      tags: tagsArray,
      content: title,
      user_id: user.id,
      created_at: new Date().toISOString(),
      is_ai_processed: false,
      group: 1,
      val: 5,
    };

    const { error } = await supabase.from('nodes').insert(record);

    if (error) {
      console.error('Extension save error:', error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error('Extension save exception:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
