/* eslint-disable @typescript-eslint/no-explicit-any */
import { use, useCallback, useEffect, useState } from 'react';
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

type NodeOnUpdate = {
    isAiProcessed: boolean;
    content: string;
    tags: string[];
}

export interface UseHooksProps {
    supabase: SupabaseClient<any, 'public', any, any>;
    user: User | null
}

export const useNodesAi = ({ supabase, user }: UseHooksProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [nodes, setNodes] = useState<any[]>([]);

    const fetchNodes = useCallback(async () => {
        if (!user) return;

        try {
            setIsLoading(true);

            const { data, error } = await supabase
                .from('nodes_ai')
                .select('*');

            if (error) throw new Error(error.message);

            setNodes(data);
        } catch (error) {
            console.error("Error fetching node:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user, setNodes, supabase]);

    const addNode = async (node: NodeOnAdd): Promise<string | null> => {
        if (!user) {
            console.error("User is not authenticated");
            return null;
        }

        try {
            setIsLoading(true);

            const newNode = {
                user_id: user.id,
                title: node.title,
                content: node.content || '',
                type: node.type,
                url: node.url || '',
                tags: node.tags || [],
                is_ai_processed: false,
            }

            const { data, error } = await supabase
                .from('nodes_ai')
                .insert(newNode)
                .select('id')
                .single();

            if (error) throw new Error(error.message);

            return data.id;
        } catch (error) {
            console.error("Error adding node:", error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }

    const updateNode = async (nodeId: string, { isAiProcessed, content, tags }: NodeOnUpdate) => {
        if (!user) return;

        try {
            setIsLoading(true);

            const dbUpdate: Record<string, unknown> = {
                is_ai_processed: isAiProcessed,
                content,
                tags
            };


            await supabase
                .from('nodes_ai')
                .update(dbUpdate)
                .eq('id', nodeId)
                .eq('user_id', user.id);
        } catch (error) {
            console.error("Error updating node:", error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchNodes();
    }, [fetchNodes]);
    
    return {
        isNodeAiLoading: isLoading,
        nodes,

        addNode,
        updateNode,
    }
}