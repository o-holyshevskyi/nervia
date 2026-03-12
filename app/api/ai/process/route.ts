/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Клієнти
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nodeId } = body;

    if (!nodeId) {
      return NextResponse.json({ error: 'nodeId is required' }, { status: 400 });
    }

    // 1. Витягуємо сиру ноду з бази
    const { data: node, error: fetchError } = await supabaseAdmin
      .from('nodes_ai')
      .select('title, content')
      .eq('id', nodeId)
      .single();

    if (fetchError || !node) throw new Error('Node not found');

    const textToProcess = `${node.title}\n${node.content}`.trim();
    if (!textToProcess) throw new Error('Node has no text to process');
    
    // ==========================================
    // 2. ВЕКТОРИ ВІД OPENAI (Точно 1536 вимірів)
    // ==========================================
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is missing in environment variables");
    }

    const embedRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: textToProcess,
        model: "text-embedding-3-small" // Індустріальний стандарт для векторів
      })
    });

    if (!embedRes.ok) {
        const errText = await embedRes.text();
        throw new Error(`OpenAI Embedding failed: ${embedRes.status} - ${errText}`);
    }

    const embedData = await embedRes.json();
    const embedding = embedData.data[0].embedding; 

    // ==========================================
    // 3. ТЕКСТ ВІД GEMINI (Summary & Tags)
    // ==========================================
    const textModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `You are a strict data analyzer. Analyze the following note.
      Provide a JSON object with strictly two fields:
      1. "summary": A very concise, 1-sentence summary of the core idea.
      2. "tags": An array of 2 to 4 relevant keywords (strings) in lowercase.

      Text to analyze:
      "${textToProcess}"
    `;

    const chatResult = await textModel.generateContent(prompt);
    const aiAnalysisText = chatResult.response.text();

    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiAnalysisText);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", aiAnalysisText);
      aiAnalysis = { summary: "Processing failed", tags: ["error"] };
    }

    // ==========================================
    // 4. ЖОРСТКИЙ АПДЕЙТ БАЗИ
    // ==========================================
    const { error: updateError } = await supabaseAdmin
      .from('nodes_ai')
      .update({ 
        is_ai_processed: true,
        ai_summary: aiAnalysis.summary,
        tags: aiAnalysis.tags,
        embedding: embedding 
      })
      .eq('id', nodeId);

    if (updateError) throw updateError;

    // ==========================================
    // 5. ПОШУК СУСІДІВ ПО КОСМОСУ (Семантичний метчинг)
    // ==========================================
    const { data: matches, error: matchError } = await supabaseAdmin.rpc('match_nodes', {
      query_embedding: embedding,
      match_threshold: 0.75, // 75% схожості (можеш потім підкрутити)
      match_count: 5,
      exclude_id: nodeId
    });

    if (matchError) {
      console.error("Matching failed:", matchError);
      // Ми не кидаємо throw, бо сама нода вже збережена успішно.
    }

    return NextResponse.json({ 
      success: true, 
      summary: aiAnalysis.summary,
      tags: aiAnalysis.tags,
      connections: matches || [] 
    });

  } catch (error: any) {
    console.error('AI Process Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}