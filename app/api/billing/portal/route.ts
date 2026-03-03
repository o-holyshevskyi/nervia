import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/billing/portal:
 *   get:
 *     description: Returns the Lemon Squeezy customer portal URL for the authenticated user.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Portal URL (or fallback to Lemon Squeezy my-orders).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
export async function GET() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Це нормально для API-роутів, якщо кукіз не можна встановити
          }
        },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userEmail = user.email;
    const lsResponse = await fetch(`https://api.lemonsqueezy.com/v1/customers?filter[email]=${userEmail}`, {
      headers: {
        'Authorization': `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      }
    });

    const lsData = await lsResponse.json();
    const customer = lsData.data?.[0];
    const portalUrl = customer?.attributes?.urls?.customer_portal;

    return NextResponse.json({ url: portalUrl || 'https://app.lemonsqueezy.com/my-orders' });

  } catch (error) {
    console.error('Portal Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}