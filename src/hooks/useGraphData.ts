/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import { ParsedBookmark } from '../lib/bookmarkParser';
import { NodeData } from '../components/AddModal';

export function useGraphData() {
    const [user, setUser] = useState<any>(null);
    const [data, setData] = useState({ nodes: [] as any[], links: [] as any[] });
    const [isLoading, setIsLoading] = useState(true);

    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        const initSession = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                setUser(authUser);

                if (authUser) {
                    const { data: nodesData, error: nodesError } = await supabase.from('nodes').select('*');
                    const { data: linksData, error: linksError } = await supabase.from('links').select('*');

                    if (nodesError) throw nodesError;
                    if (linksError) throw linksError;

                    const formattedLinks = linksData?.map(l => ({
                        ...l,
                        relationType: l.relation_type || 'manual'
                    })) || [];

                    setData({ nodes: nodesData || [], links: formattedLinks });
                }
            } catch (error) {
                console.error("Error initializing session/data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initSession();
    }, [supabase]);

    const addNewNode = async (nodeData: NodeData) => {
        if (!user) return;

        let group = 1;
        if (nodeData.type === 'link') group = 1;
        if (nodeData.type === 'note') group = 2;
        if (nodeData.type === 'idea') group = 3;

        const newNode = { 
            id: nodeData.title,
            group: group,
            val: 5,
            type: nodeData.type,
            url: nodeData.url ?? '',
            tags: nodeData.tags,
            content: nodeData.content ?? '',
            full_data: nodeData
        };

        const newLinks: any[] = nodeData.connections.map(targetNodeId => ({
            source: nodeData.title,
            target: targetNodeId,
            relationType: 'manual',
            label: 'Manual connection',
            weight: 1
        }));

        if (nodeData.autoConnectAI && data.nodes.length > 0) {
            const availableNodes = data.nodes.filter((n: any) => {
                const nodeId = typeof n.id === 'string' ? n.id : n.id?.id;
                return !nodeData.connections.includes(nodeId);
            });

            if (availableNodes.length > 0) {
                const aiConnectionsCount = Math.floor(Math.random() * 2) + 1; 
                const shuffled = [...availableNodes].sort(() => 0.5 - Math.random());
                const selectedAiNodes = shuffled.slice(0, aiConnectionsCount);

                selectedAiNodes.forEach((aiNode: any) => {
                    const aiNodeId = typeof aiNode.id === 'string' ? aiNode.id : aiNode.id?.id;
                    const similarity = Math.floor(Math.random() * 24) + 75; 
                    newLinks.push({
                        source: nodeData.title,
                        target: aiNodeId,
                        relationType: 'ai',
                        label: `AI Generated (Similarity: ${similarity}%)`,
                        weight: 1
                    });
                });
            }
        }

        setData(prev => ({
            nodes: [...prev.nodes, newNode],
            links: [...prev.links, ...newLinks]
        }));

        const dbNode = {
            ...newNode,
            user_id: user.id,
        };

        const { error: nodeError } = await supabase.from('nodes').insert(dbNode);
        
        if (nodeError) {
            console.error("🔴 Failed to save node:", nodeError.message, nodeError.details);
            
            setData(prev => ({
                nodes: prev.nodes.filter(n => n.id !== newNode.id),
                links: prev.links.filter(l => 
                    (typeof l.source === 'object' ? l.source.id : l.source) !== newNode.id &&
                    (typeof l.target === 'object' ? l.target.id : l.target) !== newNode.id
                )
            }));
            
            return;
        }
        
        if (newLinks.length > 0) {
            const dbLinks = newLinks.map(l => ({
                source: typeof l.source === 'object' ? l.source.id : l.source,
                target: typeof l.target === 'object' ? l.target.id : l.target,
                relation_type: l.relationType,
                label: l.label,
                weight: l.weight,
                user_id: user.id
            }));
            const { error: linkError } = await supabase.from('links').insert(dbLinks);
            
            if (linkError) {
                console.error("🔴 Failed to save links:", linkError.message);
            }
        }
    };

    const addLink = async (sourceId: string, targetId: string) => {
        if (!user || sourceId === targetId) return;

        const newLink = { 
            source: sourceId, 
            target: targetId, 
            relationType: 'manual', 
            label: 'Manual connection' 
        };

        setData((prev: any) => {
            const exists = prev.links.some((l: any) => {
                const s = typeof l.source === 'object' ? l.source.id : l.source;
                const t = typeof l.target === 'object' ? l.target.id : l.target;
                return (s === sourceId && t === targetId) || (s === targetId && t === sourceId);
            });
            if (exists) return prev;
            return { ...prev, links: [...prev.links, newLink] };
        });

        await supabase.from('links').insert({
            source: typeof sourceId === 'object' ? (sourceId as any).id : sourceId,
            target: typeof targetId === 'object' ? (targetId as any).id : targetId,
            relation_type: 'manual',
            label: 'Manual connection',
            user_id: user.id
        });
    };

    const updateNode = async (nodeId: string, newData: { title?: string, content?: string, tags?: string[], url?: string }) => {
        if (!user) return;

        const newId = newData.title ?? nodeId;

        setData((prev) => {
            const newNodes = prev.nodes.map((node) => {
                if (node.id === nodeId) {
                    return { 
                        ...node, 
                        id: newId, 
                        content: newData.content ?? node.content,
                        tags: newData.tags ?? node.tags,
                        url: newData.url ?? node.url,
                    };
                }
                return node;
            });

            const newLinks = prev.links.map((link) => {
                const currentSourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const currentTargetId = typeof link.target === 'object' ? link.target.id : link.target;
                return { 
                    ...link, 
                    source: currentSourceId === nodeId ? newId : currentSourceId, 
                    target: currentTargetId === nodeId ? newId : currentTargetId 
                };
            });

            return { nodes: newNodes, links: newLinks };
        });

        await supabase.from('nodes')
            .update({
                id: newId,
                content: newData.content,
                tags: newData.tags,
                url: newData.url
            })
            .eq('id', nodeId)
            .eq('user_id', user.id);
    };

    const deleteNode = async (nodeId: string) => {
        if (!user) return;

        setData((prevData) => {
            const newNodes = prevData.nodes.filter(
                (n: any) => (typeof n.id === 'string' ? n.id : n.id?.id) !== nodeId
            );
            const newLinks = prevData.links.filter((l: any) => {
                const sourceId = typeof l.source === 'string' ? l.source : l.source?.id;
                const targetId = typeof l.target === 'string' ? l.target : l.target?.id;
                return sourceId !== nodeId && targetId !== nodeId;
            });
            return { nodes: newNodes, links: newLinks };
        });

        // if (selectedNode && (typeof selectedNode.id === 'string' ? selectedNode.id : selectedNode.id?.id) === nodeId) {
        //     setSelectedNode(null);
        // }

        await supabase.from('nodes')
            .delete()
            .eq('id', nodeId)
            .eq('user_id', user.id);
    };

    const deleteLink = async (sourceId: string, targetId: string) => {
        if (!user) return;

        setData((prev) => ({
            ...prev,
            links: prev.links.filter(l => {
                const s = typeof l.source === 'object' ? l.source.id : l.source;
                const t = typeof l.target === 'object' ? l.target.id : l.target;
                return !((s === sourceId && t === targetId) || (s === targetId && t === sourceId));
            })
        }));

        // Видаляємо з БД. Шукаємо лінк незалежно від напрямку
        await supabase.from('links')
            .delete()
            .or(`and(source.eq.${sourceId},target.eq.${targetId}),and(source.eq.${targetId},target.eq.${sourceId})`)
            .eq('user_id', user.id);
    };

    const importData = async (bookmarks: ParsedBookmark[]) => {
        if (!user) return;

        // Готуємо дані для вставки
        const nodesToInsert = bookmarks.map(b => ({
            id: b.title,        // Використовуємо Title як унікальний ID
            url: b.url,         // Тепер база знає про цю колонку
            content: b.url,     // Дублюємо в контент для пошуку
            type: 'link',
            group: 1,
            tags: b.tags || [],
            user_id: user.id,
            val: 5
        }));

        // Очищаємо від дублікатів всередині самого масиву (клієнтська перевірка)
        const uniqueNodes = nodesToInsert.filter((v, i, a) => 
            a.findIndex(t => t.id === v.id) === i
        );

        // 🔥 UPSERT з ігноруванням дублікатів
        const { data: insertedNodes, error } = await supabase
            .from('nodes')
            .upsert(uniqueNodes, { 
                onConflict: 'id', 
                ignoreDuplicates: true 
            })
            .select();

        if (error) {
            // Якщо все ще є помилка — ми побачимо її детально
            console.error("🔴 Detailed Import Error:", error.message, error.details);
            throw error;
        }

        // Оновлюємо UI тільки тими нодами, які реально додалися
        if (insertedNodes && insertedNodes.length > 0) {
            setData(prev => ({
                ...prev,
                nodes: [...prev.nodes, ...insertedNodes]
            }));
        }

        return insertedNodes?.length || 0;
    };

    const exportData = () => {
        if (data.nodes.length === 0) {
            alert("Nothing to export yet!");
            return;
        }

        // Створюємо об'єкт для експорту
        const exportObject = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            payload: {
                nodes: data.nodes,
                links: data.links
            }
        };

        // Перетворюємо в JSON рядок
        const jsonString = JSON.stringify(exportObject, null, 2);
        
        // Створюємо Blob (великий бінарний об'єкт)
        const blob = new Blob([jsonString], { type: "application/json" });
        
        // Створюємо тимчасовий URL для цього Blob
        const url = URL.createObjectURL(blob);
        
        // Створюємо невидиму кнопку для завантаження
        const link = document.createElement("a");
        link.href = url;
        
        // Формуємо красиву назву файлу: synapse_backup_2024-05-20.json
        const date = new Date().toISOString().split('T')[0];
        link.download = `synapse_backup_${date}.json`;
        
        // Симулюємо клік
        document.body.appendChild(link);
        link.click();
        
        // Прибираємо за собою
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return { 
        data, 
        isLoading,
        addNewNode, 
        updateNode,
        deleteNode,
        addLink,
        deleteLink,
        importData, 
        exportData 
    };
}
