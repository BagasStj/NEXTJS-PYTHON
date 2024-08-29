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

    // dijawab oleh flowiseAI
    const response = await flowiseAI(message);

    const reply = response.text;

    const sendReplyResponse = await sendReply(sender, reply);
    

    return NextResponse.json({ success: true, sendReplyResponse });
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

async function flowiseAI(input: string) {
  const url = 'https://flowiseai-railway-production-9629.up.railway.app/api/v1/prediction/2f25175a-5c6f-474a-918a-84ae054a92d8';

  const responses = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question: input,
      overrideConfig: {
        systemMessagePrompt: "Kamu adalah seorang asisten AI , jawab pertanyaan dengan singkat dan jelas",
      }
    }),
  });

  return responses.json();
}