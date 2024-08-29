import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return handleWebhook(req);
}

export async function GET(req: NextRequest) {
  return handleWebhook(req);
}

async function handleWebhook(req: NextRequest) {
  try {
    let sender, message;

    if (req.method === 'POST') {
      const body = await req.json();
      ({ sender, message } = body);
    } else if (req.method === 'GET') {
      const params = new URL(req.url).searchParams;
      sender = params.get('sender');
      message = params.get('message');
    }

    // Proses pesan yang diterima
    console.log('Pesan diterima:', { sender, message });

    // Kirim balasan
    const response = await sendReply(sender, "Terima kasih atas pesannya!");

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

async function sendReply(to: string, message: string) {
  const url = 'https://api.fonnte.com/send';
  const token = process.env.FONNTE_TOKEN;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': token || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      target: to,
      message: message,
    }),
  });

  return response.json();
}