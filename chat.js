import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  
  // ---------------------------------------------------------
  // 1. OBSŁUGA METODY GET (Weryfikacja FB + Pobieranie wiadomości przez stronę)
  // ---------------------------------------------------------
  if (req.method === 'GET') {
    
    // A. Czy to Twoja strona pyta o nowe wiadomości? (Polling)
    if (req.query.action === 'get_messages') {
        try {
            // Pobierz wiadomości z bazy
            const messages = await kv.lrange('chat_messages', 0, -1);
            
            if (messages && messages.length > 0) {
                // Wyczyść pobrane wiadomości, żeby nie wyświetlały się w kółko
                await kv.del('chat_messages');
                
                // Zwróć je do skryptu na stronie
                return res.status(200).json({ 
                    messages: messages.map(m => typeof m === 'string' ? JSON.parse(m) : m) 
                });
            }
            // Brak nowych wiadomości
            return res.status(200).json({ messages: [] });
        } catch (error) {
            return res.status(500).json({ error: 'Błąd bazy danych' });
        }
    }

    // B. Weryfikacja Facebooka (nie ruszamy tego)
    if (req.query['hub.verify_token'] === 'marcin20') {
      return res.status(200).send(req.query['hub.challenge']);
    }

    return res.status(403).send('Błąd tokenu lub brak akcji');
  }

  // ---------------------------------------------------------
  // 2. OBSŁUGA METODY POST (Odbieranie wiadomości)
  // ---------------------------------------------------------
  if (req.method === 'POST') {
    const body = req.body;

    // A. Wiadomość wysłana ze strony WWW (tylko potwierdzamy odbiór)
    if (body.sender === 'user_website') {
       // Tutaj normalnie byłby kod wysyłający to do API Facebooka
       // Zakładam, że masz to obsłużone lub robisz to w innym miejscu.
       // Jeśli nie, daj znać - dopiszemy to.
       return res.status(200).json({ status: 'odebrano_od_www' });
    }

    // B. Wiadomość przychodzi z Facebooka (Messenger)
    if (body.object === 'page') {
      
      await Promise.all(body.entry.map(async (entry) => {
        const webhook_event = entry.messaging[0];
        
        if (webhook_event.message) {
            const text = webhook_event.message.text;
            
            // Jeśli jest treść, zapisujemy ją dla strony WWW
            if (text) {
                await kv.rpush('chat_messages', JSON.stringify({
                    text: text,
                    from: 'messenger',
                    timestamp: Date.now()
                }));
                // Wiadomość wygasa po 1h (sprzątanie)
                await kv.expire('chat_messages', 3600);
            }
        }
      }));

      return res.status(200).send('EVENT_RECEIVED');
    }
  }

  // Inne metody
  res.status(405).end();
}
