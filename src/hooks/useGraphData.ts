/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { ParsedBookmark } from '../lib/bookmarkParser';
import { NodeData } from '../components/AddModal';

const NEW_NODE_PING_DURATION_MS = 4000;

export function useGraphData(supabase: any) {
    const [user, setUser] = useState<any>(null);
    const [data, setData] = useState({ nodes: [] as any[], links: [] as any[] });
    const [isLoading, setIsLoading] = useState(true);

    const notificationSound = useRef<HTMLAudioElement | null>(null);
    const audioUnlocked = useRef(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!notificationSound.current) {
            notificationSound.current = new Audio('/sounds/notification.mp3');
        }
    }, []);

    // Unlock audio on first user interaction (browsers block programmatic play() otherwise)
    useEffect(() => {
        if (typeof window === 'undefined' || audioUnlocked.current) return;
        const unlock = () => {
            if (audioUnlocked.current || !notificationSound.current) return;
            audioUnlocked.current = true;
            const a = notificationSound.current;
            a.volume = 0; // silent unlock so user doesn't hear a blip
            a.play().then(() => {
                a.pause();
                a.currentTime = 0;
                a.volume = 0.5; // restore volume for real notifications
            }).catch(() => {});
            document.removeEventListener('click', unlock);
            document.removeEventListener('keydown', unlock);
        };
        document.addEventListener('click', unlock, { once: true });
        document.addEventListener('keydown', unlock, { once: true });
        return () => {
            document.removeEventListener('click', unlock);
            document.removeEventListener('keydown', unlock);
        };
    }, []);

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

                    const nodeIdSet = new Set(
                        (nodesData || [])
                            .map((n: any) => (typeof n?.id === 'string' ? n.id : n?.id))
                            .filter((id: any): id is string => typeof id === 'string' && id.length > 0)
                    );

                    const formattedLinks = linksData?.map((l: any) => ({
                        ...l,
                        relationType: l.relation_type || 'manual'
                    })).filter((l: any) => {
                        const s = typeof l.source === 'string' ? l.source : l.source?.id;
                        const t = typeof l.target === 'string' ? l.target : l.target?.id;
                        // Drop orphaned links so the force-graph never throws "node not found"
                        return typeof s === 'string' && typeof t === 'string' && nodeIdSet.has(s) && nodeIdSet.has(t);
                    }) || [];

                    const normalizedNodes = (nodesData || []).map((n: any) => ({
                        ...n,
                        group: n.group != null ? n.group : (n.type === 'note' ? 2 : n.type === 'idea' ? 3 : 1)
                    }));

                    setData({ nodes: normalizedNodes, links: formattedLinks });
                }
            } catch (error) {
                console.error("Error initializing session/data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initSession();
    }, [supabase]);

    // Realtime: when a new node is inserted (e.g. via extension), add it to local state so the graph updates without refresh
    useEffect(() => {
        if (!user?.id || !supabase) return;

        const channel = supabase
            .channel('nodes-insert')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'nodes' }, (payload: { new: Record<string, unknown> }) => {
                const row = payload.new;
                if (row.user_id !== user?.id) return;
                const nodeId = row.id as string;

                if (notificationSound.current) {
                    notificationSound.current.volume = 0.5;
                    notificationSound.current.currentTime = 0;
                    notificationSound.current.play().catch((e) => console.log('Audio blocked by browser', e));
                }

                setData((prev) => {
                    if (prev.nodes.some((n: any) => (n.id ?? n.id?.id) === nodeId)) return prev;
                    const n = row;
                    const normalized = {
                        ...n,
                        group: n.group != null ? n.group : (n.type === 'note' ? 2 : n.type === 'idea' ? 3 : 1),
                        isNew: true,
                        newPingAt: Date.now(),
                    };
                    return { ...prev, nodes: [...prev.nodes, normalized] };
                });

                setTimeout(() => {
                    setData((prev) => ({
                        ...prev,
                        nodes: prev.nodes.map((n: any) => {
                            const id = typeof n.id === 'string' ? n.id : n.id?.id;
                            if (id === nodeId) return { ...n, isNew: false, newPingAt: undefined };
                            return n;
                        }),
                    }));
                }, NEW_NODE_PING_DURATION_MS);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, user?.id]);

    const addNewNode = async (nodeData: NodeData): Promise<any> => {
        if (!user) return undefined;

        let group = 1;
        if (nodeData.type === 'link') group = 1;
        if (nodeData.type === 'note') group = 2;
        if (nodeData.type === 'idea') group = 3;

        const existingIdSet = new Set(
            data.nodes
                .map((n: any) => (typeof n?.id === 'string' ? n.id : n?.id))
                .filter((id: any): id is string => typeof id === 'string' && id.length > 0)
        );
        const validTargetIds = (nodeData.connections || [])
            .map((id) => String(id))
            .filter((id) => existingIdSet.has(id));

        const newId = crypto.randomUUID();
        const newNode = {
            id: newId,
            title: nodeData.title,
            group: group,
            val: 5,
            type: nodeData.type,
            url: nodeData.url ?? '',
            tags: nodeData.tags,
            content: nodeData.content ?? '',
            full_data: nodeData
        };

        const newLinks: any[] = validTargetIds.map(targetNodeId => ({
            source: newId,
            target: targetNodeId,
            relationType: nodeData.autoConnectAI ? 'ai' : 'manual',
            label: nodeData.autoConnectAI ? 'AI connection' : 'Manual connection',
            weight: 1
        }));

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

            return undefined;
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

        return newNode;
    };

    const addLink = async (sourceId: string, targetId: string, type = 'manual', label = 'Manual connection') => {
        if (!user || sourceId === targetId) return;

        const newLink = { 
            source: sourceId, 
            target: targetId, 
            relationType: type, 
            label: label
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
            relation_type: type,
            label: label,
            user_id: user.id
        });
    };

    const updateNode = async (nodeId: string, newData: { title?: string, content?: string, tags?: string[], url?: string, is_ai_processed?: boolean, group?: number }) => {
        if (!user) return;

        setData((prev) => {
            const newNodes = prev.nodes.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        title: newData.title ?? node.title,
                        content: newData.content ?? node.content,
                        tags: newData.tags ?? node.tags,
                        url: newData.url ?? node.url,
                        is_ai_processed: newData.is_ai_processed ?? node.is_ai_processed,
                        group: newData.group ?? node.group,
                    };
                }
                return node;
            });
            return { ...prev, nodes: newNodes };
        });

        const dbUpdate: Record<string, unknown> = {};
        if (newData.title !== undefined) dbUpdate.title = newData.title;
        if (newData.content !== undefined) dbUpdate.content = newData.content;
        if (newData.tags !== undefined) dbUpdate.tags = newData.tags;
        if (newData.url !== undefined) dbUpdate.url = newData.url;
        if (newData.is_ai_processed !== undefined) dbUpdate.is_ai_processed = newData.is_ai_processed;
        if (newData.group !== undefined) dbUpdate.group = newData.group;

        if (Object.keys(dbUpdate).length === 0) return;

        await supabase.from('nodes')
            .update(dbUpdate)
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

        await supabase.from('links')
            .delete()
            .or(`and(source.eq.${sourceId},target.eq.${targetId}),and(source.eq.${targetId},target.eq.${sourceId})`)
            .eq('user_id', user.id);
    };

    const importData = async (bookmarks: ParsedBookmark[]) => {
        console.log('Call -> importData()');
        if (!user) return;

        const nodesToInsert = bookmarks.map(b => ({
            id: crypto.randomUUID(),
            title: b.title.replace(/[\n\r]/g, ' ').trim(),
            url: b.url,
            content: b.url,
            type: 'link',
            group: 1,
            tags: b.tags || [],
            user_id: user.id,
            val: 5
        }));

        const { data: insertedNodes, error } = await supabase
            .from('nodes')
            .insert(nodesToInsert)
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

        return insertedNodes || [];
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
