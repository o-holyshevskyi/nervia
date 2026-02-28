/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect } from 'react';

export type ShareScope = 'ALL' | 'GROUPS';

export interface Share {
  id: string;
  slug: string;
  user_id: string;
  scope: ShareScope;
  shared_group_ids: string[];
  created_at: string;
}

export function useSharing(supabase: any) {
  const [shares, setShares] = useState<Share[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserShares = useCallback(async (): Promise<Share[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return [];

    const { data, error } = await supabase
      .from('shares')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('useSharing fetchUserShares error:', error);
      return [];
    }

    const normalized = (data || []).map((row: any) => ({
      ...row,
      shared_group_ids: Array.isArray(row.shared_group_ids) ? row.shared_group_ids : [],
    })) as Share[];
    setShares(normalized);
    return normalized;
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const list = await fetchUserShares();
      if (!cancelled) {
        setShares(list);
        setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [fetchUserShares]);

  const createShare = useCallback(async (
    scope: ShareScope,
    groupIds?: string[]
  ): Promise<{ slug: string; url: string; id: string } | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return null;

    if (scope === 'GROUPS' && (!groupIds || groupIds.length === 0)) {
      console.error('useSharing createShare: GROUPS scope requires at least one group');
      return null;
    }

    const payload: any = {
      user_id: user.id,
      scope,
      shared_group_ids: scope === 'GROUPS' ? (groupIds || []) : [],
    };

    const { data, error } = await supabase
      .from('shares')
      .insert(payload)
      .select('id, slug')
      .single();

    if (error) {
      console.error('useSharing createShare error:', error);
      return null;
    }

    const slug = data?.slug ?? '';
    const id = data?.id ?? '';
    if (!slug) return null;

    const url = `/share/${slug}`;
    setShares((prev) => [
      {
        id,
        slug,
        user_id: user.id,
        scope,
        shared_group_ids: payload.shared_group_ids,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);

    return { slug, url, id };
  }, [supabase]);

  const deleteShare = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('shares').delete().eq('id', id);
    if (error) {
      console.error('useSharing deleteShare error:', error);
      return false;
    }
    setShares((prev) => prev.filter((s) => s.id !== id));
    return true;
  }, [supabase]);

  return {
    shares,
    isLoading,
    createShare,
    deleteShare,
    fetchUserShares,
  };
}
