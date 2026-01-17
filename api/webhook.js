import { kv } from '@vercel/kv';

export default async function handler(req, res) {

  // 1. METODA GET (Weryfikacja FB + Odbieranie wiadomości przez stronę)
  if (req.method === 'GET') {
    
    // A. Czy to Twoja strona pyta o wiadomości? (Tego brakowało!)
    if (req.query.action === 'get_messages') {
        try {
            const messages = await kv.lrange('chat_messages', 0, -1);
            
            if (messages && messages.length > 0) {
                // Czyścimy, żeby nie wyświetlać w kółko tego samego
                await kv.del('chat_messages'); 
                
                return res.status(200).json({ 
                    messages: messages.map(m => typeof m === 'string' ? JSON.parse(m) : m) 
                });
            }
            return res.status(200).json({ messages: [] });
        } catch (error) {
            console.error(error);
            return res.status(200).json({ messages: [] });
        }
    }

    // B. Weryfikacja Facebooka (To już miałaś)
    if (req.query['hub.verify_token'] === 'marcin23') {
      return res.status(200).send(req.query['hub.challenge']);
    }

    return res.status(403).send('Brak dostępu lub błędny token');
  }

  // 2. METODA POST (Przyjmowanie wiadomości z FB i strony)
  if (req.method === 'POST') {
    const body = req.body;

    // A. Jeśli wiadomość od strony WWW -> po prostu OK
    if (body.sender === 'user_website') {
       return res.status(200).json({ status: 'ok' });
    }

    // B. Jeśli wiadomość z Facebooka -> Zapisz do bazy
    if (body.object === 'page') {
      await Promise.all(body.entry.map(async (entry) => {
        const webhook_event = entry.messaging[0];
        
        // Zapisujemy tylko jeśli jest tekst
        if (webhook_event.message && webhook_event.message.text) {
            await kv.rpush('chat_messages', JSON.stringify({
                text: webhook_event.message.text,
                from: 'messenger', 
                timestamp: Date.now()
            }));
            await kv.expire('chat_messages', 3600);
        }
      }));
      return res.status(200).send('EVENT_RECEIVED');
    }
  }

  res.status(405).end();
}

