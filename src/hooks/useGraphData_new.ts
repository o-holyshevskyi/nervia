/* eslint-disable react-hooks/purity */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";
import { useNodes } from "./useNodes";
import { useLinks } from "./useLinks";

export const useGraphData = (
    supabase: SupabaseClient<any, "public", "public", any, any>,
    neuronLimit: number,
) => {
    const { nodes, isNodesLoading } = useNodes(supabase, neuronLimit);
    const { links, isLinksLoading } = useLinks(supabase);

    const graphData = useMemo(() => {
        const nodeIdSet = new Set(
            (nodes || [])
                .map((n: any) => (typeof n?.id === 'string' ? n.id : n?.id))
                .filter((id: any): id is string => typeof id === 'string' && id.length > 0)
        );

        const formattedLinks = (links ?? []).map((l: any) => ({
            ...l,
            relationType: l.relation_type || 'manual'
        })).filter((l: any) => {
            const s = typeof l.source === 'string' ? l.source : l.source?.id;
            const t = typeof l.target === 'string' ? l.target : l.target?.id;
            // Drop orphaned links so the force-graph never throws "node not found"
            return typeof s === 'string' && typeof t === 'string' && nodeIdSet.has(s) && nodeIdSet.has(t);
        });

        console.log('links:', formattedLinks)

        return {
            nodes: nodes ? nodes.map((n: any) => ({ 
                ...n,
                // Додаємо мікро-рандом для старту, щоб розірвати сингулярність D3
                x: n.x ?? (Math.random() * 10 - 5),
                y: n.y ?? (Math.random() * 10 - 5)
            })) : [],
            links: formattedLinks
        };
    }, [nodes, links]);

    return {
        graphData,
        isLoading: isNodesLoading || isLinksLoading
    }
}