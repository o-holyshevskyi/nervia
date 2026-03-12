import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Твій сервісний ключ (Service Role Key), який має права обходити RLS,
// бо API працює на бекенді і має право писати вектори.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

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

    // ==========================================
    // ТУТ БУДЕ МАГІЯ OPENAI (Вектори + Саммарі)
    // ==========================================
    console.log("Processing text:", textToProcess);
    
    // Поки що робимо фейкову затримку і фейковий апдейт, щоб ти перевірив пайплайн
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Оновлюємо прапорець у базі
    const { error: updateError } = await supabaseAdmin
      .from('nodes_ai')
      .update({ is_ai_processed: true })
      .eq('id', nodeId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'Node processed' });

  } catch (error: any) {
    console.error('AI Process Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}