import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Ініціалізуємо Supabase Admin для обходу RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. Отримуємо сире тіло запиту для перевірки підпису
    const rawBody = await req.text();
    const signature = req.headers.get('X-Signature') || '';
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!;

    // 2. Перевіряємо валідність вебхуку
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    if (digest.length !== signatureBuffer.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3. Парсимо дані
    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;
    const customData = payload.meta.custom_data || {};
    const userId = customData.user_id;

    if (!userId) {
      return NextResponse.json({ error: 'No user_id provided in custom_data' }, { status: 400 });
    }

    // 4. Логіка обробки подій
    if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
      const variantId = payload.data.attributes.variant_id.toString();
      let newPlan = 'genesis';

      if (variantId === process.env.NEXT_PUBLIC_CONSTELLATION_VARIANT_ID) {
        newPlan = 'constellation';
      } else if (variantId === process.env.NEXT_PUBLIC_SINGULARITY_VARIANT_ID) {
        newPlan = 'singularity';
      }

      const status = payload.data.attributes.status; // 'active', 'past_due', 'cancelled', 'expired'
      
      // Якщо підписка активна, оновлюємо план
      if (['active', 'on_trial'].includes(status)) {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { plan: newPlan }
        });
      } else if (['cancelled', 'expired', 'unpaid'].includes(status)) {
        // Якщо скасовано або не оплачено - повертаємо на genesis
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { plan: 'genesis' }
        });
      }
    }

    return NextResponse.json({ message: 'Webhook received' }, { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}