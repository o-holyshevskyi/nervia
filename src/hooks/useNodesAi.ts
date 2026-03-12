import { useState } from 'react';
import { SupabaseClient, User } from '@supabase/supabase-js';

type NodeType = 'link' | 'idea' | 'note';

type NodeOnAdd = {
    title: string;
    content: string;
    type: NodeType;
    url?: string;
}

export const useNodesAi = (supabase: SupabaseClient<any, 'public', any, any>, user: User) => {
    const [isNodeAiLoading, setIsNodeAiLoading] = useState<boolean>(false);

    const addNode = async (node: NodeOnAdd): Promise<string | null> => {
        if (!user) {
            console.error("User is not authenticated");
            return null;
        }

        try {
            setIsNodeAiLoading(true);

            const newNode = {
                user_id: user.id,
                title: node.title,
                content: node.content,
                type: node.type,
                url: node.url || '',
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
            setIsNodeAiLoading(false);
        }
    }
    
    return {
        isNodeAiLoading,
        
        addNode
    }
}