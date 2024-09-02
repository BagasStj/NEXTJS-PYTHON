import messageStore from '@/lib/messageStore';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    return handleWebhook(req);
}

export async function GET(req: NextRequest) {
    return handleWebhook(req);
}

async function handleWebhook(req: NextRequest) {
    
    try {
        let sender, message: any;

        if (req.method === 'POST') {
            const body = await req.json();
            ({ sender, message } = body);
        } else if (req.method === 'GET') {
            const params = new URL(req.url).searchParams;
            sender = params.get('sender');
            message = params.get('message');
        }

        // Proses pesan Starting
        console.log('Pesan diterima:', { sender, message });
        const greetings = ['hi', 'hello', 'hai', 'hallo', 'selamatpagi', 'selamatsiang', 'selamatsore', 'selamatmalam' ,'start'];
        const menuNumber = ['1', '2', '3', '4', '5'];
        const menuText = ['registrasirawatjalan', 'riwayatmedis', 'penjadwalankonsultasi', 'bpjsdanasuransi', 'pembayarandanpenagihan'];
        if (message != null) {
            if (greetings.some(greeting => message.toLowerCase().replace(/\s+/g, '').includes(greeting))) {
                let reply = "Hai!👋 Saya adalah bot interaktif yang siap membantu Anda 😁. Silahkan pilih menu unutk mengakses fiture dari bot interaktif ini : \n \n   *1. Registrasi Rawat Jalan* \n   *2. Riwayat Medis*\n   *3. Penjadwalan Konsultasi*\n   *4. BPJS dan Asuransi* \n   *5. Pembayaran dan Penagihan*  \n \nAnda Hanya perlu menginputkan nomor menu atau ketik menu tersebut sebagai contoh `2` atau `Riwayat Medis`   \n \n  *Terimakasih* 🥰";
                await sendReply(sender, reply);
                return NextResponse.json({
                    success: true,
                    reply: reply 
                });
            }

            if (menuNumber.some(menu => message.toLowerCase().replace(/\s+/g, '').includes(menu)) || menuText.some(menu => message.toLowerCase().replace(/\s+/g, '').includes(menu))) {
                let reply = "Anda telah memilih menu " + message + " \n Tolong Inputkan NIK anda untuk mengakses fitur tersebut";
                messageStore.setMessage(sender, 'nik_done');
                await sendReply(sender, reply);
                return NextResponse.json({
                    success: true,
                    reply: reply 
                });
            }

            if (messageStore.getMessage(sender) === 'nik_done') {
                const response = await flowiseAI(message);
                if(response.text == 'Tidak ada hasil yang ditemukan dalam database.'){
                    await sendReply(sender, 'Maaf , Untuk saat ini data yang anda masukan belum ada di sistem kami 😔');
                    return NextResponse.json({
                        success: true,
                        reply: response
                    });
                }
                messageStore.setMessage(sender, 'biodata_done');
                await sendReply(sender, response.text);
                return NextResponse.json({
                    success: true,
                    reply: response
                });
            }
        }


        // dijawab oleh flowiseAI
        const response = await flowiseAIGeneral(message);

        if (response.text == 'Tidak ada hasil yang ditemukan dalam database.' || response.text == 'Jawaban: Tidak ada data yang ditemukan untuk isi dari data pribadi.') {
            const response = await flowiseAIFromCSV(message);
            const reply = response.text;
            if (reply == 'hemm , iam not sure') {
                const answer = 'Maaf, saya tidak mengerti pertanyaan Anda. Silakan coba lagi. 🤔';
                await sendReply(sender, answer);
                return NextResponse.json({
                    success: true,
                    reply: reply
                });
            }

            await sendReply(sender, reply);
            return NextResponse.json({
                success: true,
                reply: reply
            });
        }

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

async function flowiseAIGeneral(input: string) {
    const url = 'https://flowiseai-railway-production-9629.up.railway.app/api/v1/prediction/c6ff5c51-b0d5-4875-a994-463ed49f0b25';

    const responses = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chatId : "77cf063c-6ed6-4592-bdc8-b89a0a162af9",
            question: input,
        }),
    });

    return responses.json();
}


async function flowiseAI(input: string) {
    const url = 'https://flowiseai-railway-production-9629.up.railway.app/canvas/8c1c3efc-a126-46dd-8f44-63b233494d46';

    const responses = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            question: `sebutkan biodata dari nik ${input}`,
        }),
    });

    return responses.json();
}

// csv file flowiseAI
async function flowiseAIFromCSV(input: string) {
    const url = 'https://flowiseai-railway-production-9629.up.railway.app/api/v1/prediction/598d0480-372a-4a3f-a376-fc832fa1ef26';

    const responses = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "question": input,
            "chatId": "ca834cec-9f97-4ea8-a929-3a656228aca3",
            "socketIOClientId": "vezTJdZz_H9JRb5QAAHt"
        }),
    });

    return responses.json();
}