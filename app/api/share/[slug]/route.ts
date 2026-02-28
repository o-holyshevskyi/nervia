/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/src/lib/supabase/admin';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug?.trim()) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: share, error: shareError } = await supabase
      .from('shares')
      .select('id, user_id, scope, shared_group_ids')
      .eq('slug', slug.trim())
      .single();

    if (shareError || !share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    const userId = share.user_id as string;
    const scope = share.scope as 'ALL' | 'GROUPS';
    const sharedGroupIds: string[] = Array.isArray(share.shared_group_ids)
      ? share.shared_group_ids
      : [];

    let nodeIds: Set<string> | null = null;

    if (scope === 'GROUPS') {
      if (sharedGroupIds.length === 0) {
        return NextResponse.json({ nodes: [], links: [], groups: [] });
      }
      const { data: nodesInScope, error: nodesError } = await supabase
        .from('nodes')
        .select('id')
        .eq('user_id', userId)
        .in('group_id', sharedGroupIds);

      if (nodesError) {
        console.error('share API nodesError:', nodesError);
        return NextResponse.json({ error: 'Failed to load shared data' }, { status: 500 });
      }

      nodeIds = new Set((nodesInScope || []).map((n: any) => n.id));
      if (nodeIds.size === 0) {
        return NextResponse.json({
          nodes: [],
          links: [],
          groups: [],
        });
      }
    }

    const nodesQuery = supabase
      .from('nodes')
      .select('*')
      .eq('user_id', userId);

    if (scope === 'GROUPS' && nodeIds) {
      nodesQuery.in('id', Array.from(nodeIds));
    }

    const { data: nodesData, error: nodesErr } = await nodesQuery;

    if (nodesErr) {
      console.error('share API nodes fetch error:', nodesErr);
      return NextResponse.json({ error: 'Failed to load nodes' }, { status: 500 });
    }

    const nodes = (nodesData || []) as any[];
    const nodeIdSet = new Set(nodes.map((n: any) => n.id));

    const linksQuery = supabase
      .from('links')
      .select('*')
      .eq('user_id', userId);

    const { data: linksData, error: linksErr } = await linksQuery;

    if (linksErr) {
      console.error('share API links fetch error:', linksErr);
      return NextResponse.json({ error: 'Failed to load links' }, { status: 500 });
    }

    const allLinks = (linksData || []) as any[];
    const links = allLinks.filter((l: any) => {
      const s = typeof l.source === 'string' ? l.source : l.source?.id;
      const t = typeof l.target === 'string' ? l.target : l.target?.id;
      return s != null && t != null && nodeIdSet.has(s) && nodeIdSet.has(t);
    }).map((l: any) => ({
      ...l,
      relationType: l.relation_type || 'manual',
    }));

    const normalizedNodes = nodes.map((n: any) => ({
      ...n,
      group: n.group != null ? n.group : (n.type === 'note' ? 2 : n.type === 'idea' ? 3 : 1),
    }));

    let groups: any[] = [];
    if (sharedGroupIds.length > 0) {
      const { data: groupsData } = await supabase
        .from('groups')
        .select('*')
        .eq('user_id', userId)
        .in('id', sharedGroupIds);
      groups = (groupsData || []) as any[];
    } else if (scope === 'ALL') {
      const { data: groupsData } = await supabase
        .from('groups')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      groups = (groupsData || []) as any[];
    }

    return NextResponse.json({
      nodes: normalizedNodes,
      links,
      groups,
    });
  } catch (e) {
    console.error('share API error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
