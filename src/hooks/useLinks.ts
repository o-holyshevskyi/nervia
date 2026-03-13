/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { UseHooksProps } from "./useNodesAi";

export type LinksOnAdd = {
    sourceId: string;
    targetId: string;
    type: 'manual' | 'ai';
    label: string;
}

export const useLinks = ({ supabase, user }: UseHooksProps) => {
    const [links, setLinks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!user) {
            setLinks([]);
            return;
        }

        // 1. ПОЧАТКОВЕ ЗАВАНТАЖЕННЯ (Snapshot)
        const fetchInitialLinks = async () => {
            try {
                setIsLoading(true);
                const { data, error } = await supabase
                    .from('links')
                    .select('*')
                    .eq('user_id', user.id); // Фільтруємо по юзеру відразу

                if (error) throw error;
                setLinks(data || []);
            } catch (error) {
                console.error("Initial links fetch failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialLinks();

        // 2. REALTIME КАНАЛ (Потік змін)
        const channel = supabase
            .channel('links-realtime-changes')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'links',
                filter: `user_id=eq.${user.id}` // Слухаємо ТІЛЬКИ свої зміни
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setLinks(prev => [...prev, payload.new]);
                } else if (payload.eventType === 'UPDATE') {
                    setLinks(prev => prev.map(l => l.id === payload.new.id ? payload.new : l));
                } else if (payload.eventType === 'DELETE') {
                    setLinks(prev => prev.filter(l => l.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, supabase]);

    const addLink = async (link: LinksOnAdd) => {
        if (!user) return;
        
        try {
            // Ми НЕ оновлюємо стейт тут вручну. 
            // Realtime-підписка вище зробить це за нас, як тільки база підтвердить запис.
            const { error } = await supabase.from('links').insert({
                source: typeof link.sourceId === 'object' ? (link.sourceId as any).id : link.sourceId,
                target: typeof link.targetId === 'object' ? (link.targetId as any).id : link.targetId,
                relation_type: link.type,
                label: link.label,
                user_id: user.id
            });

            if (error) throw error;
        } catch (error) {
            console.error("Failed to add link to DB:", error);
        }
    };

    const deleteLink = async (linkId: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('links')
                .delete()
                .eq('id', linkId)
                .eq('user_id', user.id);

            if (error) throw error;
        } catch (error) {
            console.error("Failed to delete link:", error);
        }
    };
    
    return {
        links,
        isLinksLoading: isLoading,

        addLink,
        deleteLink,
    }
}