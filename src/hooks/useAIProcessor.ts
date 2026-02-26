/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';

export function useAIProcessor(
    supabase: any, 
    onNodeUpdate: (id: string, data: any) => void,
    onAddLink: (sourceId: string, targetId: string, type: string, label: string) => Promise<void>
) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);
    const [failed, setFailed] = useState(0);

    const processQueue = async (nodes: any[], existingNodeIds: string[]) => {
        console.log('Call -> processQueue()');
        setIsProcessing(true);
        setTotal(nodes.length);
        setProgress(0);

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            
            try {
                const res = await fetch('/api/ai/process', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        mode: 'analyze_link', 
                        newNode: node,
                        existingNodes: existingNodeIds // Передаємо контекст для зв'язків
                    })
                });
                const aiData = await res.json();

                const userId = node.user_id; // Беремо userId прямо з об'єкта ноди

                if (!userId) {
                    console.error("Missing user_id for node:", node.id);
                    continue;
                }

                if (aiData.error) {
                    setFailed(prev => prev + 1); // 📈 Рахуємо помилку API
                    if (aiData.error.includes("quota")) {
                        // Якщо квота скінчилась, зупиняємо чергу, але показуємо результат
                        setFailed(prev => prev + (nodes.length - i - 1)); // Всі інші теж "пропущені"
                        break;
                    }
                    continue;
                }

                if (aiData.connections && aiData.connections.length > 0) {
                    for (const conn of aiData.connections) {
                        try {
                            // 1. Отримуємо чистий масив реальних ID з об'єкта data.nodes
                            // (Не використовуємо existingNodeIds, бо там рядки з тегами)
                            const realNodeIds = nodes.map((n: any) => 
                                typeof n.id === 'string' ? n.id : n.id?.id
                            );

                            // 2. Очищаємо назву від ШІ
                            const aiSuggestedId = conn.id.replace(/^["']|["']$/g, '').trim();

                            // 3. Шукаємо відповідність:
                            // а) Точне співпадіння
                            let finalTargetId = realNodeIds.find(id => id === aiSuggestedId);

                            // б) Часткове співпадіння (якщо ШІ скоротив "OpenAI Dashboard" до "OpenAI")
                            if (!finalTargetId) {
                                finalTargetId = realNodeIds.find(id => 
                                    id.toLowerCase().includes(aiSuggestedId.toLowerCase()) ||
                                    aiSuggestedId.toLowerCase().includes(id.toLowerCase())
                                );
                            }

                            // 4. ТІЛЬКИ ЯКЩО ЗНАЙШЛИ, створюємо зв'язок
                            if (finalTargetId && finalTargetId !== node.id) {
                                const label = `AI Similarity: ${conn.accuracy}%`;
                                await onAddLink(node.id, finalTargetId, 'ai', label);
                            } else {
                                console.warn(`[AI Resolver] Node not found for "${aiSuggestedId}". Skipping link.`);
                                setFailed(prev => prev + 1);
                            }
                        } catch (linkError) {
                            // Це заблокує виліт всього додатка (Runtime Error)
                            console.error("🔴 Error creating AI link:", linkError);
                            setFailed(prev => prev + 1);
                        }
                    }
                }

                // 1. Оновлюємо основні дані ноди в БД
                const finalTags = [...new Set([...(node.tags || []), ...(aiData.tags || [])])];
                
                await supabase.from('nodes')
                    .update({ 
                        content: aiData.summary, 
                        tags: finalTags,
                        is_ai_processed: true
                    })
                    .eq('id', node.id)
                    .eq('user_id', userId);

                // 2. Оновлюємо UI для цієї ноди
                onNodeUpdate(node.id, { content: aiData.summary, tags: finalTags });

                // 3. 🔥 Створюємо ШІ-зв'язки
                if (aiData.connections && aiData.connections.length > 0) {
                    for (const conn of aiData.connections) {
                        if (conn.id !== node.id) {
                            const label = `AI Similarity: ${conn.accuracy}%`;
                            await onAddLink(node.id, conn.id, 'ai', label);
                        }
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
                console.error(`AI failed for ${node.id}:`, err);
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
    
    return { isProcessing, progress, total, failed, processQueue };
}