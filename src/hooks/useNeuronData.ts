/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { useLinks } from "./useLinks";
import { UseHooksProps, useNodesAi } from "./useNodesAi"

export const useNeuronData = ({ supabase, user }: UseHooksProps) => {
    const { nodes, isNodeAiLoading, addNode, updateNode, deleteNode } = useNodesAi({ supabase, user });
    const { links, isLinksLoading, addLink, deleteLink } = useLinks({ supabase, user });

    const data = useMemo(() => {
        const nodeIdSet = new Set(
            (nodes || [])
                .map((n: any) => (typeof n?.id === 'string' ? n.id : n?.id))
                .filter((id: any): id is string => typeof id === 'string' && id.length > 0)
        );

        const formattedLinks = links?.map((l: any) => ({
            ...l,
            relationType: l.relation_type || 'manual'
        })).filter((l: any) => {
            const s = typeof l.source === 'string' ? l.source : l.source?.id;
            const t = typeof l.target === 'string' ? l.target : l.target?.id;
            
            return typeof s === 'string' && typeof t === 'string' && nodeIdSet.has(s) && nodeIdSet.has(t);
        }) || [];

        return { nodes: nodes, links: formattedLinks };
    }, [nodes, links]);

    return {
        isLoading: isNodeAiLoading || isLinksLoading,
        data,

        addNode,
        updateNode,
        deleteNode,

        addLink,
        deleteLink,
    }
}