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

    const fetchLinks = useCallback(async () => {
        if (!user) return;

        try {
            setIsLoading(true);

            const { data, error } = await supabase
                .from('links')
                .select('*');

            if (error) throw new Error(error.message);

            setLinks(data);
        } catch (error) {
            console.error("Error fetching links:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user, supabase]);

    const addLink = async (link: LinksOnAdd) => {
        if (!user) return;
        
        try {
            setIsLoading(true);

            const newLink = { 
                source: link.sourceId, 
                target: link.targetId, 
                relationType: link.type, 
                label: link.label
            };

            const { error } = await supabase.from('links').insert({
                source: typeof link.sourceId === 'object' ? (link.sourceId as any).id : link.sourceId,
                target: typeof link.targetId === 'object' ? (link.targetId as any).id : link.targetId,
                relation_type: link.type,
                label: link.label,
                user_id: user.id
            });

            if (error) throw new Error(error.message);
        } catch (error) {
            console.error("Error adding node:", error);
        } finally {
            setIsLoading(false);
        }
    }

    const deleteLink = () => {
        
    }

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);
    
    return {
        links,
        isLinksLoading: isLoading,

        addLink,
        deleteLink,
    }
}