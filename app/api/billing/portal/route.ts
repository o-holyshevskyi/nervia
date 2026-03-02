import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // 1. Отримуємо сесію користувача з Supabase
    // Примітка: використовуємо стандартний підхід для отримання юзера на сервері
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Використовуємо адмін-ключ для надійності
    const supabase = createClient(supabaseUrl, supabaseKey);

    // В реальному додатку ми маємо отримати Auth токен з хедерів запиту
    // Для спрощення припустимо, що ми отримуємо поточного сесійного юзера
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.email;

    // 2. Робимо запит до Lemon Squeezy API, щоб знайти клієнта за Email
    const lsResponse = await fetch(`https://api.lemonsqueezy.com/v1/customers?filter[email]=${userEmail}`, {
      headers: {
        'Authorization': `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      }
    });

    const lsData = await lsResponse.json();

    // 3. Отримуємо URL порталу з даних клієнта
    // Lemon Squeezy повертає масив клієнтів. Беремо першого.
    const customer = lsData.data?.[0];
    const portalUrl = customer?.attributes?.urls?.customer_portal;

    if (!portalUrl) {
      // Якщо клієнт ще нічого не купував, відправляємо на загальну сторінку замовлень
      return NextResponse.json({ url: 'https://app.lemonsqueezy.com/my-orders' });
    }

    return NextResponse.json({ url: portalUrl });

  } catch (error) {
    console.error('Portal Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}