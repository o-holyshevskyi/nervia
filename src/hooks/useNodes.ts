/* eslint-disable @typescript-eslint/no-explicit-any */
import { SupabaseClient } from "@supabase/supabase-js";
import { useUser } from "./useUser"
import { useCallback, useEffect, useState } from "react";
import { NodeDb, NodeOnAdd } from "./types/types";

function normalizeUrl(url: string | undefined): string {
    if (url == null || typeof url !== 'string') return '';
    const t = url.trim().toLowerCase();
    if (!t) return '';
    if (!/^https?:\/\//i.test(t)) return `https://${t}`;
    return t;
}

export const useNodes = (
    supabase: SupabaseClient<any, "public", "public", any, any>,
    neuronLimit: number,
) => {
    const { user, isLoading: isUserLoading } = useUser(supabase);

    const [nodes, setNodes] = useState<any[] | undefined>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const fetchNodes = useCallback(async (): Promise<void> => {
        if (!user) return;

        try {
            setIsLoading(true);
            const { data, error } = await supabase.from('nodes').select('*');

            if (error) throw error;

            setNodes(data);
        } catch (error) {
            console.error("Error fetch nodes:", error);
        } finally {
            setIsLoading(false);
        }
    }, [supabase, user]);

    const addNewNode = async (node: NodeOnAdd): Promise<boolean> => {
        if (!user || !nodes) return false;

        try {
            setIsLoading(true);
            if (typeof neuronLimit === 'number' && nodes.length >= neuronLimit) {
                const err = new Error('NEURON_LIMIT_REACHED') as Error & { code?: string };
                err.code = 'NEURON_LIMIT_REACHED';
                throw err;
            }

            const titleLower = (node.title ?? '').toString().trim().toLowerCase();
            const urlNorm = normalizeUrl(node.url);

            const duplicateTitle = nodes.some(
                (n: any) => (n.title ?? n.content ?? n.id ?? '').toString().trim().toLowerCase() === titleLower
            );

            if (duplicateTitle) {
                throw new Error(`A neuron with the title "${(node.title ?? '').toString().trim()}" already exists.`);
            }

            if (urlNorm) {
                const duplicateUrl = nodes.some((n: any) => {
                    const u = (n.url ?? '').toString().trim();
                    return u && normalizeUrl(u) === urlNorm;
                });
                if (duplicateUrl) {
                    throw new Error('A neuron with this URL already exists.');
                }
            }

            const newNodeId = crypto.randomUUID();

            const newNode: NodeDb = {
                id: newNodeId,
                title: node.title,
                type: node.type,
                url: node.url ?? '',
                tags: node.tags,
                content: node.content ?? '',
                full_data: node,
                group_id: null,
                is_ai_processed: false,
                user_id: user.id,
            };

            setNodes((prev) => ([...prev || [], newNode]));

            const { error } = await supabase.from('nodes').insert(newNode);

            if (error) {
                setNodes((prev) => (
                    prev?.filter(n => n.id !== newNode.id))
                );

                throw error;
            }

            return true;
        } catch (error) {
            console.error("Error add node:", error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }
    
    useEffect(() => {
        fetchNodes();
    }, [fetchNodes]);
    
    return {
        nodes,
        isNodesLoading: isUserLoading || isLoading,

        addNewNode,
    }
}