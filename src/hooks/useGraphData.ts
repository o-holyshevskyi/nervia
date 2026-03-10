/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { ParsedBookmark } from '../lib/bookmarkParser';
import { ParsedObsidianNote } from '../lib/obsidianParser';
import { NodeData } from '../components/AddModal';
import { toast } from 'sonner';

const NEW_NODE_PING_DURATION_MS = 4000;

/** Normalize URL for duplicate check: lowercase, trim, default to https. */
function normalizeUrl(url: string | undefined): string {
    if (url == null || typeof url !== 'string') return '';
    const t = url.trim().toLowerCase();
    if (!t) return '';
    if (!/^https?:\/\//i.test(t)) return `https://${t}`;
    return t;
}

export interface UseGraphDataOptions {
    /** Max neurons allowed (e.g. 60 for Genesis). Enforced in addNewNode. */
    neuronLimit?: number;
}

export function useGraphData(supabase: any, options?: UseGraphDataOptions) {
    const neuronLimit = options?.neuronLimit;
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
                    const n = row as Record<string, unknown>;
                    const normalized = {
                        ...n,
                        title: n.title ?? n.Title ?? '',
                        content: n.content ?? n.Content ?? '',
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
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'nodes' }, (payload: { new: Record<string, unknown> }) => {
                const row = payload.new as Record<string, unknown>;
                if (row.user_id !== user?.id) return;
                const nodeId = row.id as string;
                setData((prev) => {
                    const existing = prev.nodes.find((n: any) => (n.id ?? n.id?.id) === nodeId);
                    if (!existing) return prev;
                    let rowTitle = (row.title ?? row.Title ?? existing.title ?? '').toString().trim();
                    let rowContent = (row.content ?? row.Content ?? existing.content ?? '').toString().trim();
                    if (rowTitle === nodeId || /^[0-9a-f-]{36}$/i.test(rowTitle)) rowTitle = (existing.title ?? '').toString().trim();
                    if (rowContent === nodeId || /^[0-9a-f-]{36}$/i.test(rowContent)) rowContent = (existing.content ?? '').toString().trim();
                    const merged = {
                        ...existing,
                        ...row,
                        title: rowTitle || (existing.title ?? ''),
                        content: rowContent || (existing.content ?? ''),
                        group: row.group != null ? row.group : existing.group,
                        updated_at: row.updated_at ?? existing.updated_at,
                    };
                    return {
                        ...prev,
                        nodes: prev.nodes.map((n: any) =>
                            (n.id ?? n.id?.id) === nodeId ? merged : n
                        ),
                    };
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, user?.id]);

    const addNewNode = async (nodeData: NodeData): Promise<any> => {
        if (!user) return undefined;

        // Enforce neuron limit (Genesis 60). For security, also add Supabase RLS on nodes INSERT.
        if (typeof neuronLimit === 'number' && data.nodes.length >= neuronLimit) {
            const err = new Error('NEURON_LIMIT_REACHED') as Error & { code?: string };
            err.code = 'NEURON_LIMIT_REACHED';
            throw err;
        }

        const titleLower = (nodeData.title ?? '').toString().trim().toLowerCase();
        const urlNorm = normalizeUrl(nodeData.url);

        const duplicateTitle = data.nodes.some(
            (n: any) => (n.title ?? n.content ?? n.id ?? '').toString().trim().toLowerCase() === titleLower
        );
        if (duplicateTitle) {
            throw new Error(`A neuron with the title "${(nodeData.title ?? '').toString().trim()}" already exists.`);
        }

        if (urlNorm) {
            const duplicateUrl = data.nodes.some((n: any) => {
                const u = (n.url ?? '').toString().trim();
                return u && normalizeUrl(u) === urlNorm;
            });
            if (duplicateUrl) {
                throw new Error('A neuron with this URL already exists.');
            }
        }

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

    const updateNode = async (nodeId: string, newData: { title?: string, content?: string, tags?: string[], url?: string, is_ai_processed?: boolean, group?: number, group_id?: string | null }) => {
        if (!user) return;

        if (newData.title !== undefined) {
            const titleLower = newData.title.trim().toLowerCase();
            const duplicateTitle = data.nodes.some((n: any) => {
                const id = typeof n.id === 'string' ? n.id : n.id?.id;
                if (id === nodeId) return false;
                return (n.title ?? n.content ?? n.id ?? '').toString().trim().toLowerCase() === titleLower;
            });
            if (duplicateTitle) {
                throw new Error(`A neuron with the title "${newData.title.trim()}" already exists.`);
            }
        }
        if (newData.url !== undefined && newData.url.trim()) {
            const urlNorm = normalizeUrl(newData.url);
            const duplicateUrl = data.nodes.some((n: any) => {
                const id = typeof n.id === 'string' ? n.id : n.id?.id;
                if (id === nodeId) return false;
                const u = (n.url ?? '').toString().trim();
                return u && normalizeUrl(u) === urlNorm;
            });
            if (duplicateUrl) {
                throw new Error('A neuron with this URL already exists.');
            }
        }

        const nowIso = new Date().toISOString();
        const nodeIdNorm = nodeId;
        setData((prev) => {
            const newNodes = prev.nodes.map((node) => {
                const nid = typeof node.id === 'string' ? node.id : node.id?.id;
                if (nid !== nodeIdNorm) return node;
                const proposedTitle = newData.title !== undefined ? newData.title : node.title;
                const titleIsNodeId = proposedTitle != null && String(proposedTitle).trim() === nodeIdNorm;
                const safeTitle = titleIsNodeId ? (node.title ?? '') : (newData.title ?? node.title);
                return {
                    ...node,
                    title: safeTitle,
                    content: newData.content ?? node.content,
                    tags: newData.tags ?? node.tags,
                    url: newData.url ?? node.url,
                    is_ai_processed: newData.is_ai_processed ?? node.is_ai_processed,
                    group: newData.group ?? node.group,
                    group_id: newData.group_id !== undefined ? newData.group_id : node.group_id,
                    updated_at: nowIso,
                };
            });
            return { ...prev, nodes: newNodes };
        });

        const dbUpdate: Record<string, unknown> = {
            updated_at: nowIso,
        };
        if (newData.title !== undefined) dbUpdate.title = newData.title;
        if (newData.content !== undefined) dbUpdate.content = newData.content;
        if (newData.tags !== undefined) dbUpdate.tags = newData.tags;
        if (newData.url !== undefined) dbUpdate.url = newData.url;
        if (newData.is_ai_processed !== undefined) dbUpdate.is_ai_processed = newData.is_ai_processed;
        if (newData.group !== undefined) dbUpdate.group = newData.group;
        if (newData.group_id !== undefined) dbUpdate.group_id = newData.group_id;

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

    /** Normalize title for wikilink/title matching: trim, lowercase. */
    function normalizeTitle(t: string): string {
        return (t ?? '').toString().trim().toLowerCase();
    }

    const importData = async (
        items: ParsedBookmark[] | ParsedObsidianNote[] | any[],
        source?: 'html' | 'notion' | 'obsidian' | 'json'
    ) => {
        console.log('Call -> importData()');
        if (!user) return [];

        if (source === 'json') {
            const nodesToInsert = items.map((n) => ({
                id: n._originalId || crypto.randomUUID(), // Зберігаємо старий ID, якщо є
                title: n.title,
                content: n.content,
                url: n.url,
                type: n.type,
                group: n.group,
                group_id: n.group_id,
                tags: n.tags || [],
                user_id: user.id,
                is_ai_processed: true, // Вже оброблено, це ж бекап
                val: 5
            }));

            const { data: insertedNodes, error } = await supabase
                .from('nodes')
                .insert(nodesToInsert)
                .select();

            if (error) {
                console.error("🔴 Detailed Import Error:", error.message, error.details);
                throw error;
            }

            if (insertedNodes && insertedNodes.length > 0) {
                setData((prev) => ({
                    ...prev,
                    nodes: [...prev.nodes, ...insertedNodes]
                }));
                // (Опціонально) Тут колись можна буде додати відновлення лінків (links) з бекапу
            }

            return insertedNodes || [];
        }

        const isObsidian = source === 'obsidian' || (items.length > 0 && 'wikilinks' in items[0]);
        const isNotion = source === 'notion';

        if (isObsidian || isNotion) {
            const notes = items as any[]; // Тут будуть ParsedObsidianNote або ParsedNotionNote
            const nodesToInsert = notes.map((n) => ({
                id: crypto.randomUUID(),
                title: n.title.replace(/[\n\r]/g, ' ').trim(),
                url: '',
                content: n.content ?? '',
                type: 'note', 
                group: isObsidian ? 6 : 7,     
                tags: n.tags || [],
                user_id: user.id,
                is_ai_processed: true,
            }));

            const { data: insertedNodes, error } = await supabase
                .from('nodes')
                .insert(nodesToInsert)
                .select();

            if (error) {
                console.error("🔴 Detailed Import Error:", error.message, error.details);
                throw error;
            }

            if (insertedNodes && insertedNodes.length > 0) {
                setData((prev) => ({
                    ...prev,
                    nodes: [...prev.nodes, ...insertedNodes]
                }));

                // Мапимо лінки (wikilinks для Obsidian, links для Notion)
                const allNodes = [...data.nodes, ...insertedNodes];
                const titleToId = new Map<string, string>();
                for (const node of allNodes) {
                    const id = typeof node.id === 'string' ? node.id : (node as any).id?.id;
                    const title = (node.title ?? '').toString().trim();
                    if (id && title) titleToId.set(normalizeTitle(title), id);
                }

                for (let i = 0; i < insertedNodes.length; i++) {
                    const sourceId = (insertedNodes[i] as any).id;
                    // Для Obsidian беремо wikilinks, для Notion - links
                    const connectionsToMap = isObsidian ? (notes[i].wikilinks ?? []) : (notes[i].links ?? []);
                    
                    for (const targetTitle of connectionsToMap) {
                        const targetId = titleToId.get(normalizeTitle(targetTitle));
                        if (targetId && targetId !== sourceId) {
                            // Додаємо лінк. Для Notion можемо зробити окремий label
                            await addLink(sourceId, targetId, 'ai', isNotion ? 'Notion Link' : 'Obsidian link');
                        }
                    }
                }
            }

            return insertedNodes || [];
        }

        const bookmarks = items as ParsedBookmark[];
        const nodesToInsert = bookmarks.map((b) => ({
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
            console.error("🔴 Detailed Import Error:", error.message, error.details);
            throw error;
        }

        if (insertedNodes && insertedNodes.length > 0) {
            setData((prev) => ({
                ...prev,
                nodes: [...prev.nodes, ...insertedNodes]
            }));
        }

        return insertedNodes || [];
    };

    const exportData = () => {
        try {
            // 1. Формуємо об'єкт з нашими даними
            // data.nodes і data.links - це твій поточний стейт графа
            const exportData = {
                version: "1.0",
                exportDate: new Date().toISOString(),
                nodes: data.nodes,
                links: data.links,
                // groups: groups // якщо хочеш ще й групи/кластери бекапити (опціонально)
            };

            // 2. Перетворюємо в красивий JSON (з відступами)
            const jsonString = JSON.stringify(exportData, null, 2);
            
            // 3. Створюємо Blob (файл у пам'яті браузера)
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            
            // 4. Генеруємо назву файлу з поточною датою
            const dateStr = new Date().toISOString().split('T')[0]; // "2026-03-09"
            const filename = `nervia-universe-backup-${dateStr}.json`;

            // 5. Створюємо тимчасовий лінк і клікаємо по ньому для завантаження
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            
            // 6. Прибираємо за собою
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success("Universe exported successfully!");
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Failed to export your data.");
        }
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
