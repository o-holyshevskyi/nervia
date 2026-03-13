/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_GENERAL_COLOR = '#64748b';

export interface Group {
    id: string;
    user_id: string;
    name: string;
    color: string;
    sort_order: number;
    created_at?: string;
}

export function useGroups(supabase: any) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchGroups = useCallback(async (userId: string): Promise<{ data: Group[]; ok: boolean }> => {
        const { data, error } = await supabase
            .from('groups')
            .select('*')
            .eq('user_id', userId)
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true });

        if (error) {
            const msg = (error as { message?: string })?.message ?? String(error);
            const code = (error as { code?: string })?.code;
            console.error('useGroups fetch error:', code ? `${code}: ${msg}` : msg);
            return { data: [], ok: false };
        }
        return { data: (data || []) as Group[], ok: true };
    }, [supabase]);

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user?.id) {
                    setGroups([]);
                    return;
                }

                const { data: listData, ok: fetchOk } = await fetchGroups(user.id);
                const list = listData;
                if (fetchOk) {
                    const hasGeneral = list.some((g: Group) => g.name.trim().toLowerCase() === 'general');
                    // if (!hasGeneral) {
                    //     const { data: inserted, error: insertErr } = await supabase
                    //         .from('groups')
                    //         .insert({
                    //             user_id: user.id,
                    //             name: 'No Group',
                    //             color: DEFAULT_GENERAL_COLOR,
                    //             sort_order: 0,
                    //         })
                    //         .select()
                    //         .single();
                    //     if (!insertErr && inserted && !cancelled) {
                    //         list = [inserted as Group, ...list.filter((g: Group) => g.id !== inserted.id)];
                    //     }
                    // }
                }

                if (!cancelled) setGroups(list);
            } catch (e) {
                console.error('useGroups init error:', e);
                if (!cancelled) setGroups([]);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        init();
        return () => { cancelled = true; };
    }, [supabase, fetchGroups]);

    // Realtime: sync newly created/updated groups from backend (e.g. AI-created groups)
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    useEffect(() => {
        if (!supabase) return;

        let cancelled = false;
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.id || cancelled) return;

            const channel = supabase
                .channel('groups-changes')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'groups' }, (payload: { new: Record<string, unknown> }) => {
                    const row = payload.new;
                    if (row.user_id !== user.id) return;
                    const newGroup = row as unknown as Group;
                    setGroups((prev) => {
                        if (prev.some((g) => g.id === newGroup.id)) return prev;
                        return [...prev, newGroup].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name));
                    });
                })
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'groups' }, (payload: { new: Record<string, unknown> }) => {
                    const row = payload.new;
                    if (row.user_id !== user.id) return;
                    const updated = row as unknown as Group;
                    setGroups((prev) =>
                        prev.map((g) => (g.id === updated.id ? { ...g, ...updated } : g))
                    );
                })
                .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'groups' }, (payload: { old: Record<string, unknown> }) => {
                    const id = (payload.old?.id as string) ?? '';
                    setGroups((prev) => prev.filter((g) => g.id !== id));
                })
                .subscribe();

            if (!cancelled) channelRef.current = channel;
            else supabase.removeChannel(channel);
        })();

        return () => {
            cancelled = true;
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [supabase]);

    const addGroup = useCallback(async (name: string, color: string): Promise<Group | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return null;

        const { data: inserted, error } = await supabase
            .from('groups')
            .insert({
                user_id: user.id,
                name: name.trim(),
                color: color || DEFAULT_GENERAL_COLOR,
                sort_order: groups.length,
            })
            .select()
            .single();

        if (error) {
            console.error('useGroups addGroup error:', error);
            return null;
        }
        const newGroup = inserted as Group;
        setGroups((prev) => [...prev, newGroup].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)));
        return newGroup;
    }, [supabase, groups.length]);

    const deleteGroup = useCallback(async (id: string) => {
        const { error } = await supabase.from('groups').delete().eq('id', id);
        if (error) {
            console.error('useGroups deleteGroup error:', error);
            return;
        }
        setGroups((prev) => prev.filter((g) => g.id !== id));
    }, [supabase]);

    const refetch = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;
        const { data: listData, ok } = await fetchGroups(user.id);
        if (ok && listData) setGroups(listData);
    }, [supabase, fetchGroups]);

    return { groups, isLoading, addGroup, deleteGroup, refetch };
}
