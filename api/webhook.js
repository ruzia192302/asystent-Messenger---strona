import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  
  // 1. Weryfikacja Facebooka (To u Ciebie działało dobrze)
  if (req.method === 'GET') {
    if (req.query['hub.verify_token'] === 'marcin20') { // Twój token ze screena
      return res.status(200).send(req.query['hub.challenge']);
    }
    return res.status(403).send('Błąd tokenu');
  }

  // 2. Odbieranie wiadomości (POST)
  if (req.method === 'POST') {
    const body = req.body;

    // A. Obsługa wiadomości wysłanej ze strony WWW (Twoja logika)
    if (body.sender === 'user_website') {
       console.log('Wiadomość wysłana ze strony:', body.message);
       // Tutaj zakładam, że masz kod wysyłający do FB, którego nie widać na screenie
       // lub robisz to w innym pliku. Zostawiam bez zmian.
       return res.status(200).json({ status: 'odebrano_www' });
    }

    // B. Obsługa wiadomości z Facebooka (Messenger)
    if (body.object === 'page') {
      
      // Musimy poczekać na przetworzenie wszystkich wpisów
      await Promise.all(body.entry.map(async (entry) => {
        const webhook_event = entry.messaging[0];
        
        // Sprawdzamy czy to wiadomość
        if (webhook_event.message) {
            
            // Pobieramy treść wiadomości
            const text = webhook_event.message.text;
            // Pobieramy ID rozmówcy (lub ID odbiorcy jeśli to echo od admina)
            const senderId = webhook_event.sender.id;
            const recipientId = webhook_event.recipient.id;

            // Logika: Jeśli wiadomość jest echem (od Admina) lub zwykłą wiadomością
            // Zapisujemy ją w bazie, aby strona mogła ją pobrać.
            // Używamy klucza "chat_messages" (uproszczone dla jednej konwersacji)
            
            if (text) {
                // Zapisz wiadomość w bazie KV (Redis)
                // Wygasa po 1 godzinie (3600 sekund) żeby nie zapychać bazy
                await kv.rpush('chat_messages', JSON.stringify({
                    text: text,
                    from: 'messenger',
                    timestamp: Date.now()
                }));
                await kv.expire('chat_messages', 3600);
            }
        }
      }));

      return res.status(200).send('EVENT_RECEIVED');
    }
  }
  
  // Obsługa innych metod
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
