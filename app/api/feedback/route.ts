import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/src/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const { error } = await resend.emails.send({
      from: 'Nervia App <hello@nervia.space>',
      to: 'hello@nervia.space',
      replyTo: user.email,
      subject: 'Mission Feedback from Nervia',
      html: `
        <div style="font-family: sans-serif; color: #e5e5e5; max-width: 600px;">
          <p style="color: #a3a3a3; font-size: 12px; margin-bottom: 8px;">From:</p>
          <p style="margin-bottom: 24px;">${user.email}</p>
          <p style="color: #a3a3a3; font-size: 12px; margin-bottom: 8px;">Message:</p>
          <p style="white-space: pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend feedback error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Feedback API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
