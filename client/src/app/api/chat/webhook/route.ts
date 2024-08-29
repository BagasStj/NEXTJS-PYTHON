import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { device, sender, message, payload } = req.body;

      // Proses pesan yang diterima
      console.log('Pesan diterima:', { device, sender, message, payload });

      // Kirim balasan
      const response = await sendReply(sender, 'Terima kasih atas pesannya!');

      res.status(200).json({ success: true, response });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function sendReply(to: string, message: string) {
  const url = 'https://api.fonnte.com/send';
  const token = process.env.FONNTE_TOKEN;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': token || '', // Ensure token is defined
      'Content-Type': 'application/json',
    } as HeadersInit, // Explicitly cast to HeadersInit
    body: JSON.stringify({
      target: to,
      message: message,
    }),
  });

  return response.json();
}