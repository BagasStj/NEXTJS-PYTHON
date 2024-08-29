import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {  sender, message } = body;

    // Proses pesan yang diterima
    console.log('Pesan diterima:', {  sender, message });

    // Kirim balasan
    const response = await sendReply(sender, 'Terima kasih atas pesannya!');

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