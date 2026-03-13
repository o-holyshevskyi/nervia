/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { SupabaseClient, User } from '@supabase/supabase-js';

type NodeType = 'link' | 'idea' | 'note';

export type NodeOnAdd = {
    title: string;
    type: NodeType;
    content?: string;
    url?: string;
    tags?: string[];
    autoConnectAI: boolean;
}

// Гнучкий тип для оновлення
type NodeOnUpdate = {
    title?: string;
    content?: string;
    tags?: string[];
    groupId?: string | null;
    isAiProcessed?: boolean;
}

export interface UseHooksProps {
    supabase: SupabaseClient<any, 'public', any, any>;
    user: User | null
}

export const useNodesAi = ({ supabase, user }: UseHooksProps) => {
    const [isFetching, setIsFetching] = useState<boolean>(true);
    const [nodes, setNodes] = useState<any[]>([]);

    useEffect(() => {
        if (!user) {
            setIsFetching(false);
            return;
        }

        const fetchInitial = async () => {
            const { data } = await supabase.from('nodes_ai').select('*');
            if (data) setNodes(data);
            setIsFetching(false);
        };
        fetchInitial();

        const channel = supabase
            .channel('nodes-realtime')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'nodes_ai' 
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setNodes(prev => [...prev, payload.new]);
                } else if (payload.eventType === 'UPDATE') {
                    setNodes(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
                } else if (payload.eventType === 'DELETE') {
                    setNodes(prev => prev.filter(n => n.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user, supabase]);

    const addNode = async (node: NodeOnAdd): Promise<string | null> => {
        if (!user) return null;
        try {
            const newNode = {
                user_id: user.id,
                title: node.title,
                content: node.content || '',
                type: node.type,
                url: node.url || '',
                tags: node.tags || [],
                is_ai_processed: false,
            }
            const { data, error } = await supabase.from('nodes_ai').insert(newNode).select('*').single();
            if (error) throw error;
            return data.id;
        } catch (error) {
            console.error("Error adding node:", error);
            return null;
        }
    }

    // ОНОВЛЕНА ФУНКЦІЯ
    const updateNode = async (nodeId: string, updates: NodeOnUpdate) => {
        if (!user) return;

        try {
            // Динамічно збираємо об'єкт для бази
            const dbUpdate: Record<string, any> = {};

            if (updates.title !== undefined) dbUpdate.title = updates.title;
            if (updates.content !== undefined) dbUpdate.content = updates.content;
            if (updates.tags !== undefined) dbUpdate.tags = updates.tags;
            if (updates.groupId !== undefined) dbUpdate.group_id = updates.groupId;
            if (updates.isAiProcessed !== undefined) dbUpdate.is_ai_processed = updates.isAiProcessed;

            const { error } = await supabase
                .from('nodes_ai')
                .update(dbUpdate)
                .eq('id', nodeId)
                .eq('user_id', user.id);

            if (error) throw error;

            // Стейт оновиться автоматично через Realtime канал
        } catch (error) {
            console.error("Error updating node:", error);
        }
    }

    const deleteNode = async (nodeId: string) => {
        if (!user) return;
        try {
            await supabase.from('nodes_ai').delete().eq('id', nodeId).eq('user_id', user.id);
        } catch (error) {
            console.error("Error deleting node:", error);
        }
    }

    return {
        isNodeAiLoading: isFetching,
        nodes,
        addNode,
        updateNode,
        deleteNode,
    }
}