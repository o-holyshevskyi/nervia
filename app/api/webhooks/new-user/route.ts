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
      from: 'Nervia <hello@nervia.space>', // Твій підтверджений домен
      to: userEmail,
      subject: 'Welcome to your 3D Knowledge Universe! 🪐',
      html: `
        <div style="background-color: #050505; padding: 40px; font-family: sans-serif; color: #ffffff; text-align: center; border-radius: 16px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #818cf8; font-size: 24px; letter-spacing: -1px;">Welcome to Nervia 🚀</h1>
          
          <p style="color: #a3a3a3; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
            We're thrilled to have you on board. You've just taken the first step towards building your ultimate 3D knowledge graph.
          </p>

          <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 0 auto 30px auto; max-width: 400px; text-align: left;">
            <h3 style="color: #e5e5e5; font-size: 13px; margin-top: 0; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">Next Steps:</h3>
            <ul style="color: #a3a3a3; font-size: 14px; line-height: 24px; padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 8px;">Install our Chrome Web Clipper</li>
              <li style="margin-bottom: 8px;">Save your first 5 Neurons</li>
              <li>Watch your constellation grow!</li>
            </ul>
          </div>

          <a href="https://app.nervia.space" style="background-color: #6366f1; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">
            Launch Dashboard
          </a>

          <div style="margin-top: 40px; border-top: 1px solid #1e293b; padding-top: 20px;">
            <p style="color: #525252; font-size: 12px;">
              Have questions? Just reply directly to this email.<br>
              Founding Member Edition — Singularity Access
            </p>
          </div>
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