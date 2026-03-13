/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const { nodeId } = await req.json();
        if (!nodeId) return NextResponse.json({ error: 'nodeId is required' }, { status: 400 });

        // 1. Витягуємо сиру ноду + user_id (ВАЖЛИВО для груп)
        const { data: node, error: fetchError } = await supabaseAdmin
            .from('nodes_ai')
            .select('title, content, user_id')
            .eq('id', nodeId)
            .single();

        if (fetchError || !node) throw new Error('Node not found');
        const textToProcess = `${node.title}\n${node.content}`.trim();
        if (!textToProcess) throw new Error('Node has no text to process');

        // 2. Витягуємо поточні групи юзера, щоб ШІ не галюцинував дублікати
        const { data: existingGroups } = await supabaseAdmin
            .from('groups')
            .select('id, name')
            .eq('user_id', node.user_id);
            
        const groupsContext = existingGroups && existingGroups.length > 0 
            ? JSON.stringify(existingGroups.map(g => ({ id: g.id, name: g.name }))) 
            : "[]";

        // 3. ВЕКТОРИ ВІД OPENAI
        const embedRes = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ input: textToProcess, model: "text-embedding-3-small" })
        });
        if (!embedRes.ok) throw new Error(`OpenAI Embedding failed`);
        const embedding = (await embedRes.json()).data[0].embedding; 

        // 4. ТЕКСТ ВІД GEMINI (Summary, Tags, Grouping)
        const textModel = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `You are a strict data architect. Analyze the text and categorize it.
        Current available groups: ${groupsContext}.
        
        Provide a JSON object strictly in this format:
        {
          "reasoning": "Briefly explain WHY you chose the existing group or WHY you are creating a new one.",
          "summary": "1-sentence summary.",
          "tags": ["tag1", "tag2", "tag3"],
          "group": {
             "action": "USE_EXISTING" or "CREATE_NEW",
             "id": "UUID from the available groups ONLY IF action is USE_EXISTING, else null",
             "new_name": "Short precise name ONLY IF action is CREATE_NEW, else null",
             "new_color": "Hex color code (e.g., #06b6d4) ONLY IF action is CREATE_NEW, else null"
          }
        }
        
        CRITICAL RULES FOR GROUPING:
        1. Groups MUST represent high-level THEMATIC DOMAINS of knowledge (e.g., "Artificial Intelligence", "Finance", "Neuroscience"). 
        2. DO NOT group by grammatical, structural, or generic metadata categories (e.g., NEVER use concepts like "Named Entities", "Short Notes", "Miscellaneous").
        3. Prefer USE_EXISTING *only* if the text strongly aligns with the thematic domain of an existing group. 
        4. If the text belongs to a distinct thematic domain not present in the list, you MUST use CREATE_NEW.

        Text to analyze:
        "${textToProcess}"`;

        const chatResult = await textModel.generateContent(prompt);
        const aiAnalysis = JSON.parse(chatResult.response.text());

        // 5. ЛОГІКА ГРУП (База Даних)
        let finalGroupId = null;
        let isNewGroupCreated = false;
        
        if (aiAnalysis.group) {
            if (aiAnalysis.group.action === 'USE_EXISTING' && aiAnalysis.group.id) {
                finalGroupId = aiAnalysis.group.id;
            } else if (aiAnalysis.group.action === 'CREATE_NEW' && aiAnalysis.group.new_name) {
                // Створюємо нову групу прямо тут, на бекенді
                const { data: newGroup, error: groupErr } = await supabaseAdmin
                    .from('groups')
                    .insert({
                        user_id: node.user_id,
                        name: aiAnalysis.group.new_name,
                        color: aiAnalysis.group.new_color || '#64748b',
                        sort_order: 999 // Або вирахувати макс
                    })
                    .select('id')
                    .single();
                    
                if (!groupErr && newGroup) {
                    finalGroupId = newGroup.id;
                    isNewGroupCreated = true;
                }
            }
        }

        // 6. ЖОРСТКИЙ АПДЕЙТ БАЗИ (Тепер із групою)
        const updatePayload: any = { 
            is_ai_processed: true,
            ai_summary: aiAnalysis.summary,
            tags: aiAnalysis.tags,
            embedding: embedding 
        };
        if (finalGroupId) updatePayload.group_id = finalGroupId; // Прив'язуємо групу

        const { error: updateError } = await supabaseAdmin
            .from('nodes_ai')
            .update(updatePayload)
            .eq('id', nodeId);

        if (updateError) throw updateError;

        // 7. ПОШУК СУСІДІВ
        const { data: matches } = await supabaseAdmin.rpc('match_nodes', {
            query_embedding: embedding, match_threshold: 0.55, match_count: 5, exclude_id: nodeId
        });

        return NextResponse.json({ 
            success: true, 
            summary: aiAnalysis.summary,
            tags: aiAnalysis.tags,
            groupId: finalGroupId,
            isNewGroupCreated: isNewGroupCreated,
            connections: matches || [] 
        });

    } catch (error: any) {
        console.error('AI Process Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}