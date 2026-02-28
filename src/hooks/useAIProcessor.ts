/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useRef } from 'react';

const MAX_NODES_PER_RUN = 25;

export function useAIProcessor(
    supabase: any,
    onNodeUpdate: (id: string, data: any) => void,
    onAddLink: (sourceId: string, targetId: string, type: string, label: string) => Promise<void>,
    nodes: any[] = []
) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);
    const [failed, setFailed] = useState(0);

    const nodesRef = useRef(nodes);
    nodesRef.current = nodes;

    const getNodeTitle = (n: any) => (n.title ?? n.content ?? n.id)?.toString?.() ?? '';
    const getNodeId = (n: any) => typeof n.id === 'string' ? n.id : n.id?.id;

    const pendingUnprocessedKey = useMemo(
        () =>
            nodes
                .filter((n: any) => n.is_ai_processed === false)
                .map((n: any) => getNodeId(n))
                .filter(Boolean)
                .sort()
                .join(','),
        [nodes]
    );

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const processQueue = async (nodes: any[], existingNodes: any[]) => {
        console.log('Call -> processQueue()');
        setIsProcessing(true);
        setTotal(nodes.length);
        setProgress(0);

        const existingLinesForAPI = (existingNodes || []).map((n: any) => {
            const title = getNodeTitle(n);
            const url = (n.url || '').slice(0, 120);
            return url ? `${title} | ${url}` : title;
        }).filter(Boolean);

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const nodeId = getNodeId(node);

            try {
                let aiData: any = null;
                for (let attempt = 1; attempt <= 3; attempt++) {
                    const res = await fetch('/api/ai/process', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            mode: 'analyze_link',
                            newNode: node,
                            existingNodes: existingLinesForAPI
                        })
                    });

                    aiData = await res.json().catch(() => ({}));

                    const isRateLimited =
                        res.status === 429 ||
                        aiData?.error === 'RATE_LIMIT' ||
                        (typeof aiData?.error === 'string' && aiData.error.toLowerCase().includes('rate_limit'));

                    if (isRateLimited) {
                        const retrySeconds = Number(aiData?.retryAfterSeconds) || 40;
                        console.warn(`⏳ AI rate-limited. Retrying node ${nodeId} in ~${retrySeconds}s (attempt ${attempt}/3)...`);
                        await sleep(retrySeconds * 1000 + 250);
                        continue;
                    }

                    break;
                }

                const userId = node.user_id;

                if (!userId) {
                    console.error("Missing user_id for node:", node.id);
                    continue;
                }

                if (aiData.error) {
                    setFailed(prev => prev + 1);
                    if (typeof aiData.error === 'string' && aiData.error.includes("quota")) {
                        setFailed(prev => prev + (nodes.length - i - 1));
                        break;
                    }
                    continue;
                }

                if (aiData.connections && aiData.connections.length > 0) {
                    for (const conn of aiData.connections) {
                        try {
                            const aiSuggestedTitle = (conn.id ?? '').toString().replace(/^["']|["']$/g, '').trim();
                            const targetNode = existingNodes.find((n: any) => {
                                const t = getNodeTitle(n).toLowerCase();
                                return t === aiSuggestedTitle.toLowerCase() ||
                                    t.includes(aiSuggestedTitle.toLowerCase()) ||
                                    aiSuggestedTitle.toLowerCase().includes(t);
                            });
                            const finalTargetId = targetNode ? getNodeId(targetNode) : null;

                            if (finalTargetId && finalTargetId !== nodeId) {
                                const label = `AI Similarity: ${conn.accuracy ?? 0}%`;
                                await onAddLink(nodeId, finalTargetId, 'ai', label);
                            } else {
                                console.warn(`[AI Resolver] Node not found for "${aiSuggestedTitle}". Skipping link.`);
                                setFailed(prev => prev + 1);
                            }
                        } catch (linkError) {
                            console.error("🔴 Error creating AI link:", linkError);
                            setFailed(prev => prev + 1);
                        }
                    }
                }

                // 1. Оновлюємо основні дані ноди в БД (включаючи AI-призначену групу по group_id)
                const finalTags = [...new Set([...(node.tags || []), ...(aiData.tags || [])])];
                const groupId = Object.prototype.hasOwnProperty.call(aiData, 'group_id')
                    ? (typeof aiData.group_id === 'string' && aiData.group_id.length > 0 ? aiData.group_id : null)
                    : undefined;
                const dbUpdate: Record<string, unknown> = {
                    content: aiData.summary,
                    tags: finalTags,
                    is_ai_processed: true,
                };
                if (groupId !== undefined) dbUpdate.group_id = groupId;

                await supabase.from('nodes')
                    .update(dbUpdate)
                    .eq('id', nodeId)
                    .eq('user_id', userId);

                onNodeUpdate(nodeId, {
                    content: aiData.summary,
                    tags: finalTags,
                    is_ai_processed: true,
                    ...(groupId !== undefined && { group_id: groupId }),
                });

                await sleep(350);
            } catch (err) {
                console.error(`AI failed for ${nodeId}:`, err);
                setFailed(prev => prev + 1);
            }

            setProgress(i + 1);
        }

        setTimeout(() => {
            setIsProcessing(false);
            setTimeout(() => {
                setProgress(0);
                setTotal(0);
            }, 500);
        }, 2500);
    };

    // Auto-trigger: when there are unprocessed nodes and we're not already processing, run the queue
    useEffect(() => {
        if (!pendingUnprocessedKey || isProcessing) return;
        const currentNodes = nodesRef.current;
        if (currentNodes.length === 0) return;
        const pending = currentNodes.filter((n: any) => n.is_ai_processed === false);
        if (pending.length === 0) return;
        console.log(`🚀 Found ${pending.length} unprocessed nodes. Resuming AI sync...`);
        processQueue(pending.slice(0, MAX_NODES_PER_RUN), currentNodes);
    }, [pendingUnprocessedKey, isProcessing]);

    return { isProcessing, progress, total, failed, processQueue };
}