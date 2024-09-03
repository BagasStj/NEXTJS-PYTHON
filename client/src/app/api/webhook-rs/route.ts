import redisClient from '@/lib/redisClient';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    return handleWebhook(req);
}

export async function GET(req: NextRequest) {
    return handleWebhook(req);
}

async function handleWebhook(req: NextRequest) {
    try {
        const systemMessagePrompt2 = 'Anda adalah seorang asisten AI yang sangat ahli dalam memberikan informasi medis dan pengetahuan tentang berbagai kondisi penyakit. Anda hanya dapat menjawab pertanyaan yang terkait dengan kondisi penyakit, pengobatan, gejala, penyebab, dan perawatan yang relevan. Anda tidak dapat menjawab pertanyaan yang berada di luar lingkup medis dan kesehatan. Setiap pertanyaan yang diajukan oleh pengguna tentang kondisi penyakit akan dicatat dan disimpan dalam memori Anda, memungkinkan Anda untuk merujuk ke pertanyaan sebelumnya guna memberikan jawaban yang lebih akurat dan sesuai dengan konteks pertanyaan baru yang terkait. \n Contoh penggunaan: \n •	Pengguna dapat menanyakan gejala, penyebab, atau pengobatan dari suatu penyakit. \n•	Anda dapat memberikan informasi tentang langkah-langkah pencegahan, perawatan mandiri, atau kapan harus mencari bantuan medis profesional. \n•	Anda dapat menjelaskan perbedaan antara kondisi-kondisi yang sering disalahpahami atau memberikan saran umum berdasarkan pengetahuan medis yang terpercaya. jika terdapat pertanyaan yang tidak relevan , tolong berikan jawaban "maaf untuk saat ini saya hanya bisa menjawab tentang kesehatan atau kondisi medis . Jika anda ingin mengganti menu , tolong ketikan `start` . Terimakasih"';
        const ststemMessagePrompt4 = "Anda adalah asisten AI yang sangat berpengetahuan luas dalam hal asuransi kesehatan, termasuk BPJS dan berbagai jenis asuransi kesehatan lainnya. Anda hanya dapat menjawab pertanyaan yang terkait dengan informasi tentang BPJS, asuransi kesehatan, cakupan layanan, prosedur klaim, dan manfaat yang tersedia. Anda tidak dapat menjawab pertanyaan di luar lingkup asuransi kesehatan. Setiap pertanyaan yang diajukan oleh pengguna mengenai BPJS atau asuransi kesehatan akan dicatat dan disimpan dalam memori Anda, memungkinkan Anda merujuk ke pertanyaan sebelumnya untuk memberikan jawaban yang lebih akurat dan sesuai dengan konteks pertanyaan baru yang terkait. \n Contoh penggunaan:\n •	Pengguna dapat menanyakan tentang jenis layanan yang ditanggung oleh BPJS atau asuransi kesehatan tertentu.\n •	Anda dapat memberikan informasi tentang prosedur pendaftaran BPJS atau asuransi kesehatan lainnya, termasuk syarat dan ketentuannya.\n •	Anda dapat menjelaskan perbedaan antara BPJS dan asuransi kesehatan swasta, serta kelebihan dan kekurangan masing-masing.\n •	Anda dapat memberikan panduan tentang cara mengajukan klaim, dokumen yang diperlukan, dan proses klaim asuransi.\n •	Anda dapat menjawab pertanyaan tentang biaya premi, jangkauan perlindungan, serta cara memilih asuransi kesehatan yang sesuai dengan kebutuhan.  jika terdapat pertanyaan yang tidak relevan , tolong berikan jawaban 'maaf untuk saat ini saya hanya bisa menjawab tentang kesehatan atau kondisi medis . Jika anda ingin mengganti menu , tolong ketikan `start` . Terimakasih'"
        let sender, message: any;

        if (req.method === 'POST') {
            const body = await req.json();
            ({ sender, message } = body);
        } else if (req.method === 'GET') {
            const params = new URL(req.url).searchParams;
            sender = params.get('sender');
            message = params.get('message');
        }

        console.log('Pesan diterima:', { sender, message }, await redisClient.get(sender));
        const greetings = ['hi', 'hello', 'hai', 'hallo', 'selamatpagi', 'selamatsiang', 'selamatsore', 'selamatmalam', 'start'];
        const menuText = ['registrasirawatjalan', 'riwayatmedis', 'penjadwalankonsultasi', 'bpjsdanasuransi', 'pembayarandanpenagihan'];

        if (message != null) {
            // Proses pesan Starting
            if (greetings.some(greeting => message.toLowerCase().replace(/\s+/g, '').includes(greeting))) {
                await redisClient.del(sender);
                await redisClient.del(sender + "_menu");
                let reply = "Hai!👋 Saya adalah bot interaktif yang siap membantu Anda 😁. Silahkan pilih menu unutk mengakses fiture dari bot interaktif ini : \n \n   *1. Registrasi Rawat Jalan* \n   *2. Riwayat Medis*\n   *3. Penjadwalan Konsultasi*\n   *4. BPJS dan Asuransi* \n   *5. Pembayaran dan Penagihan*  \n \nAnda Hanya perlu menginputkan nomor menu atau ketik menu tersebut sebagai contoh `2` atau `Riwayat Medis`   \n \n  *Terimakasih* 🥰";
                await redisClient.set(sender, 'initial'); // Set message to initial
                console.log('Set message to initial for sender:', sender);
                await sendReply(sender, reply);
                return NextResponse.json({
                    success: true,
                    reply: reply
                });
            }

            // Proses Input NIK
            if (message == '1' || message == '2' || message == '3' || message == '4' || message == '5' || menuText.some(menu => message.toLowerCase().replace(/\s+/g, '').includes(menu))) {
                let reply = "Anda telah memilih menu " + message + " \nTolong Inputkan NIK anda untuk mengakses fitur tersebut";
                await redisClient.set(sender, 'nik_done');
                await redisClient.set(sender + "_menu", message);
                console.log('Set message to nik_done for sender:', sender);
                await sendReply(sender, reply);
                return NextResponse.json({
                    success: true,
                    reply: reply
                });
            }

            // cek nik ke databse
            // RIWAYAT MEDIS
            const storedMessage = await redisClient.get(sender);
            const storedMenu = await redisClient.get(sender + "_menu");
            console.log('Stored message:', storedMessage, storedMenu);
            if (storedMessage == 'nik_done' && (storedMenu == '2' || storedMenu == 'riwayatmedis')) {
                const systemMessagePrompt = 'Given an input question, first construct a syntactically correct {dialect} query to run, then look at the query results and return the answer. Unless the user specifies in their question a specific number of examples they want to get, always limit your query to a maximum of {top_k} results. \n You can sort the results by relevant columns to return the most interesting examples in the database.the given data is patient data with their disease \n   if the user asks about the disease they are suffering from, answer by referring to the disease columnif there is a question "sebutkan biodata dari {input}", then answer with an example "Berdasarkan NIK 330111, nama anda adalah Ali Nasgor, mempunyai nomor bpjs ketenagakerjaan 001135 dengan masa berlaku sampai 2024-06-23" , If the question relates to information that is not in this database, answer with "No results found in the database."  \n  Never ask for all columns from a given table, ask for only a few columns that are relevant to the question.Be careful to only use column names that you can see in the schema description. Be careful not to ask for columns that do not exist. \n Also pay attention to which columns are in which tables.Please answer in Indonesian   Use the following format: \n Question: "Question here" \n SQLQuery: "SQL query to be executed" \n  SQLResult: "Result of SQLQuery \n "Answer: "Final answer here" \n Use only the tables listed below. {table_info} \n Question: {input}'
                const response = await flowiseAI(message, systemMessagePrompt, 'SampleDataPasien');
                console.log('Response flow 1:', response);
                if (response.text == 'Tidak ada hasil yang ditemukan dalam database.' || response.text == 'No results found in the database.') {
                    await sendReply(sender, 'Maaf , Untuk saat ini data yang anda masukan belum ada di sistem kami 😔');
                    return NextResponse.json({
                        success: true,
                        reply: response
                    });
                }
                await redisClient.set(sender, 'biodata_done');
                console.log('Set message to biodata_done for sender:', sender);
                await sendReply(sender, response.text);
                await flowiseAIGeneral(response.text.replace('anda', 'aku'), systemMessagePrompt2 ,sender);
                return NextResponse.json({
                    success: true,
                    reply: response
                });
            }

            // BPJS DAN ASURANSI
            if (storedMessage == 'nik_done' && (storedMenu == '4' || storedMenu == 'bpjsdanasuransi')) {
                const systemMessagePrompt = 'Given an input question, first construct a syntactically correct {dialect} query to run, then look at the query results and return the answer. Unless the user specifies in their question a specific number of examples they want to get, always limit your query to a maximum of {top_k} results. \n You can sort the results by relevant columns to return the most interesting examples in the database  \n if there is a question "sebutkan biodata dari {input}", then answer with an example "Berdasarkan NIK 330111, nama anda adalah Ali Nasgor, anda memiliki riwayat penyakit asma, adakah yang ingin anda tanyakan dengan penyakit asma" . If the question relates to information that is not in this database, answer with "No results found in the database."  \n  Never ask for all columns from a given table, ask for only a few columns that are relevant to the question.Be careful to only use column names that you can see in the schema description. Be careful not to ask for columns that do not exist. Also pay attention to which columns are in which tables. \n Please answer in Indonesian   Use the following format: \n Question: "Question here" \n SQLQuery: "SQL query to be executed" \n  SQLResult: "Result of SQLQuery \n "Answer: "Final answer here" \n Use only the tables listed below. {table_info} \n Question: {input}'
                const response = await flowiseAI(message, systemMessagePrompt, 'SampleDataBPJSAsuransi');
                console.log('Response flow 1:', response);
                if (response.text == 'Tidak ada hasil yang ditemukan dalam database.' || response.text == 'No results found in the database.') {
                    await sendReply(sender, 'Maaf , Untuk saat ini data yang anda masukan belum ada di sistem kami 😔');
                    return NextResponse.json({
                        success: true,
                        reply: response
                    });
                }
                await redisClient.set(sender, 'biodata_done');
                console.log('Set message to biodata_done for sender:', sender);
                await sendReply(sender, response.text);
                await flowiseAIGeneral(response.text.replace('anda', 'aku'), ststemMessagePrompt4 ,sender);
                return NextResponse.json({
                    success: true,
                    reply: response
                });
            }
        }
        const storedMessage = await redisClient.get(sender);
        const storedMenu = await redisClient.get(sender+"_menu");
        if (storedMessage == 'biodata_done') {
            // dijawab oleh flowiseAI
            let prompt :any = systemMessagePrompt2
            if(storedMenu == '2' || storedMenu == 'riwayatmedis'){
                prompt = systemMessagePrompt2
            } else {
                prompt = ststemMessagePrompt4
            }
            let response :any = await flowiseAIGeneral(message, prompt  ,sender);
    
            if (response.text == 'Tidak ada hasil yang ditemukan dalam database.' || response.text == 'Jawaban: Tidak ada data yang ditemukan untuk isi dari data pribadi.') {
                const reply = response.text;
                await sendReply(sender, reply);
                return NextResponse.json({
                    success: true,
                    reply: reply
                });
            }

            const reply = response.text;
            await sendReply(sender, reply);
            return NextResponse.json({
                success: true,
                reply: reply
            });
        }


        const sendReplyResponse = await sendReply(sender, 'maaf , mungkin anda salah pilih menu , silahkan ketik `start` untuk memulai ulang');

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

async function flowiseAIGeneral(input: string, systemMessagePrompt: string , sessionid :any) {
    console.log("FLOWISEAIGENERAL", input , systemMessagePrompt , sessionid)
    const url = 'https://flowiseai-railway-production-9629.up.railway.app/api/v1/prediction/c6ff5c51-b0d5-4875-a994-463ed49f0b25';

    const responses = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            question: input,
            systemMessagePrompt: systemMessagePrompt,
            chatId : `0a9d3dff-265b-49a3-a41c-${sessionid}`
        }),
    });

    return responses.json();
}

async function flowiseAI(input: string, systemMessagePrompt: string, tablle: string) {
    console.log("FLOWISEAIGENERAL", input , systemMessagePrompt , tablle)
    const url = 'https://flowiseai-railway-production-9629.up.railway.app/api/v1/prediction/8c1c3efc-a126-46dd-8f44-63b233494d46';

    const responses = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            question: `sebutkan biodata dari nik ${input}`,
            includesTables: tablle,
            customPrompt: systemMessagePrompt
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
        }),
    });

    return responses.json();
}