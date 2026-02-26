/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import { NodeData } from '@/src/components/AddModal';

export function useGraphData(user: any) {
    const [data, setData] = useState({ nodes: [] as any[], links: [] as any[] });
    const [isLoading, setIsLoading] = useState(true);
    
    const supabase = useMemo(() => createClient(), []);

    // Завантаження даних
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user) return;
            setIsLoading(true);
            const { data: nodes } = await supabase.from('nodes').select('*');
            const { data: links } = await supabase.from('links').select('*');
            
            setData({
                nodes: nodes || [],
                links: links?.map(l => ({ ...l, relationType: l.relation_type || 'manual' })) || []
            });
            setIsLoading(false);
        };
        fetchInitialData();
    }, [user, supabase]);

    const addNode = async (nodeData: NodeData) => {
        if (!user) return;

        const group = nodeData.type === 'link' ? 1 : nodeData.type === 'note' ? 2 : 3;
        
        const newNode = { 
            id: nodeData.title, 
            group, 
            val: 5, 
            type: nodeData.type, 
            tags: nodeData.tags, 
            content: nodeData.content ?? '', 
            user_id: user.id 
        };

        // 🔗 Відновлюємо логіку створення зв'язків
        const newLinks = nodeData.connections.map(targetId => ({
            source: nodeData.title,
            target: targetId,
            relationType: 'manual',
            user_id: user.id
        }));

        // ✅ Оптимістичне оновлення (додаємо і ноду, і лінки)
        setData(prev => ({ 
            nodes: [...prev.nodes, newNode],
            links: [...prev.links, ...newLinks]
        }));

        try {
            // Зберігаємо в базу
            const { error: nodeError } = await supabase.from('nodes').insert(newNode);
            if (nodeError) throw nodeError;

            if (newLinks.length > 0) {
                const dbLinks = newLinks.map(l => ({
                    source: l.source,
                    target: l.target,
                    relation_type: 'manual',
                    user_id: user.id
                }));
                await supabase.from('links').insert(dbLinks);
            }
        } catch (error) {
            console.error("🔴 Failed to save:", error);
            // Rollback при помилці
            setData(prev => ({
                nodes: prev.nodes.filter(n => n.id !== newNode.id),
                links: prev.links.filter(l => l.source !== newNode.id)
            }));
        }

        return newNode;
    };

    const updateNode = async (nodeId: string, newData: any) => {
        if (!user) return;
        const { error } = await supabase.from('nodes').update(newData).eq('id', nodeId).eq('user_id', user.id);
        if (!error) {
            setData(prev => ({
                nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, ...newData } : n),
                links: prev.links // тут може знадобитися логіка оновлення ID в лінках
            }));
        }
    };

    const deleteNode = async (nodeId: string) => {
        if (!user) return;
        const { error } = await supabase.from('nodes').delete().eq('id', nodeId).eq('user_id', user.id);
        if (!error) {
            setData(prev => ({
                nodes: prev.nodes.filter(n => n.id !== nodeId),
                links: prev.links.filter(l => l.source !== nodeId && l.target !== nodeId)
            }));
        }
    };

    const addLink = async (source: string, target: string) => {
        if (!user) return;
        const newLink = { source, target, relation_type: 'manual', user_id: user.id };
        const { error } = await supabase.from('links').insert(newLink);
        if (!error) {
            setData(prev => ({ ...prev, links: [...prev.links, { ...newLink, relationType: 'manual' }] }));
        }
    };

    const deleteLink = async (sourceId: string, targetId: string) => {
        if (!user) return;
        const { error } = await supabase.from('links')
            .delete()
            .or(`and(source.eq.${sourceId},target.eq.${targetId}),and(source.eq.${targetId},target.eq.${sourceId})`)
            .eq('user_id', user.id);
        
        if (!error) {
            setData(prev => ({
                ...prev,
                links: prev.links.filter(l => !((l.source === sourceId && l.target === targetId) || (l.source === targetId && l.target === sourceId)))
            }));
        }
    };

    return { data, isLoading, addNode, updateNode, deleteNode, addLink, deleteLink };
}