import { kv } from '@vercel/kv';

export default async function handler(req, res) {

  // -----------------------------------------------------------------
  // 1. METODA GET: Weryfikacja FB LUB Pobieranie wiadomości przez stronę
  // -----------------------------------------------------------------
  if (req.method === 'GET') {
    
    // A. Czy to Twoja strona pyta o wiadomości? (Polling)
    if (req.query.action === 'get_messages') {
        try {
            // Pobieramy wiadomości z "pudełka"
            const messages = await kv.lrange('chat_messages', 0, -1);
            
            if (messages && messages.length > 0) {
                // Czyścimy pudełko po pobraniu, żeby nie czytać 2 razy tego samego
                await kv.del('chat_messages');
                
                // Wysyłamy do strony WWW
                return res.status(200).json({ 
                    messages: messages.map(m => typeof m === 'string' ? JSON.parse(m) : m) 
                });
            }
            return res.status(200).json({ messages: [] });
        } catch (error) {
            console.error(error);
            return res.status(200).json({ messages: [] }); // Nie psuj strony błędami
        }
    }

    // B. Weryfikacja Facebooka (Twój token: marcin20)
    if (req.query['hub.verify_token'] === 'marcin20') {
      return res.status(200).send(req.query['hub.challenge']);
    }

    return res.status(403).send('Błąd weryfikacji');
  }

  // -----------------------------------------------------------------
  // 2. METODA POST: Odbieranie wiadomości od FB i strony
  // -----------------------------------------------------------------
  if (req.method === 'POST') {
    const body = req.body;

    // A. Wiadomość wysłana ze strony WWW (tylko potwierdzamy)
    if (body.sender === 'user_website') {
       // Tutaj kod wysyłający do FB (jeśli masz go w innym miejscu, to OK)
       // Jeśli nie, API FB powinno być wywołane tutaj.
       return res.status(200).json({ status: 'ok' });
    }

    // B. Wiadomość przychodzi z Facebooka (Messenger)
    if (body.object === 'page') {
      
      await Promise.all(body.entry.map(async (entry) => {
        const webhook_event = entry.messaging[0];
        
        // Jeśli to wiadomość tekstowa
        if (webhook_event.message && webhook_event.message.text) {
            
            // Zapisujemy w bazie KV
            await kv.rpush('chat_messages', JSON.stringify({
                text: webhook_event.message.text,
                from: 'messenger', 
                timestamp: Date.now()
            }));
            
            // Wiadomości wygasają po 1h (żeby nie zapchać bazy)
            await kv.expire('chat_messages', 3600);
        }
      }));

      return res.status(200).send('EVENT_RECEIVED');
    }
  }

  res.status(405).end();
}
