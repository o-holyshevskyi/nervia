/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/src/lib/supabase/admin';

/**
 * @swagger
 * /api/notifications/visit:
 *   post:
 *     description: Records a visit to a shared collection (used when someone opens a shared link). Creates a "New Visit" notification for the share owner.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slug]
 *             properties:
 *               slug:
 *                 type: string
 *                 description: Share slug from the shared URL
 *     responses:
 *       201:
 *         description: Visit recorded.
 *       400:
 *         description: Missing slug.
 *       404:
 *         description: Share not found.
 *       500:
 *         description: Failed to record visit or internal server error.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: share, error: shareError } = await supabase
      .from('shares')
      .select('id, user_id, scope, shared_group_ids')
      .eq('slug', slug)
      .single();

    if (shareError || !share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    const userId = share.user_id as string;
    const scope = share.scope as 'ALL' | 'GROUPS';
    const sharedGroupIds: string[] = Array.isArray(share.shared_group_ids)
      ? share.shared_group_ids
      : [];

    let message: string;
    let groupIdForMeta: string | null = null;

    if (sharedGroupIds.length === 1) {
      const { data: groupsData } = await supabase
        .from('groups')
        .select('name')
        .eq('user_id', userId)
        .in('id', sharedGroupIds)
        .limit(1);
      const groupName = (groupsData?.[0] as any)?.name ?? 'collection';
      message = `Someone is exploring your ${groupName} collection`;
      groupIdForMeta = sharedGroupIds[0];
    } else if (sharedGroupIds.length > 1) {
      message = 'Someone is exploring your shared collection';
      groupIdForMeta = sharedGroupIds[0];
    } else {
      message = 'Someone is exploring your Universe';
    }

    const { error: insertError } = await supabase.from('notifications').insert({
      user_id: userId,
      title: 'New Visit',
      message,
      type: 'visit',
      metadata: { group_id: groupIdForMeta },
    });

    if (insertError) {
      console.error('notifications/visit insert error:', insertError);
      return NextResponse.json({ error: 'Failed to record visit' }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error('notifications/visit error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
