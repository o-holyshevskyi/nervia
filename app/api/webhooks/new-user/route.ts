import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    // 1. Перевіряємо секретний ключ
    const secret = req.headers.get('x-webhook-secret');
    if (secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Отримуємо дані від Supabase
    const payload = await req.json();
    
    // Supabase передає дані щойно створеного юзера в об'єкті "record"
    const userEmail = payload.record.email;

    if (!userEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    // 3. Відправляємо красивий лист через Resend
    const { data, error } = await resend.emails.send({
      from: 'Nervia <hello@nervia.space>', // Переконайся, що домен доданий у Resend
      to: userEmail,
      subject: 'Welcome to your 3D Knowledge Universe! 🪐',
      html: `
        <div style="font-family: sans-serif; color: #171717; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Nervia! 🚀</h2>
          <p>We're thrilled to have you on board. You've just taken the first step towards building your ultimate 3D knowledge graph.</p>
          <p><strong>Next steps:</strong></p>
          <ul>
            <li>Install our Chrome Web Clipper (if you haven't already).</li>
            <li>Save your first 5 Neurons.</li>
            <li>Watch your constellation grow!</li>
          </ul>
          <p>If you have any questions, just reply to this email.</p>
          <p>Happy mapping,<br/>The Nervia Team</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Welcome email sent!' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}