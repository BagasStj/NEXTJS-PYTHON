import { Pool, PoolClient } from 'pg';
import { NextResponse } from 'next/server';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface AntrianPayload {
  id: number;
  username: string;
  nik: string;
  nomor_hp: string;
  no_antrian: string;
  date: string;
}

async function listenForChanges() {
  const client: PoolClient = await pool.connect();
  try {
    await client.query('LISTEN sampledatanomorantrian_changes');
    
    client.on('notification', async (msg: { payload?: string }) => {
      const payload: AntrianPayload = JSON.parse(msg.payload || '{}');
      const message = `Halo ${payload.username}, nomor antrian Anda: ${payload.no_antrian} untuk tanggal ${payload.date}.`;
      await sendReply('081334319568', message);
    });

    // Keep the connection alive
    setInterval(() => {
      client.query('SELECT 1');
    }, 60000);

  } catch (error) {
    console.error('Error in listener:', error);
    client.release();
  }
}

// Start listening when the server starts
listenForChanges();

export async function GET() {
  return NextResponse.json({ status: 'Listener active for SampleDataNomorAntrian' });
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