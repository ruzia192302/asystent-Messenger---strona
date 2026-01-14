// api/webhook.js
// UWAGA: To jest uproszczony magazyn pamięci. Na produkcji użyj np. Vercel KV / Redis.
let TEMP_MESSAGES = []; 

export default async function handler(req, res) {
  
  // 1. ODBIERANIE WIADOMOŚCI OD STRONY WWW (POST)
  if (req.method === 'POST') {
    const body = req.body;

    // A. Wiadomość ze strony WWW (użytkownik pisze do Ciebie)
    if (body.sender === 'user_website') {
        console.log("Wiadomość od klienta WWW:", body.message);
        // Tu powinna być logika wysyłki do Messengera (zakładam, że masz to zrobione, skoro działa)
        return res.status(200).json({ status: 'odebrano' });
    }

    // B. Wiadomość z Facebooka (Ty odpisujesz klientowi)
    if (body.object === 'page') {
      
      // Iterujemy przez zdarzenia (Facebook może przysłać kilka naraz)
      body.entry.forEach(entry => {
        if (entry.messaging) {
            let webhook_event = entry.messaging[0];
            
            // Sprawdzamy czy to wiadomość tekstowa (a nie np. potwierdzenie przeczytania)
            if (webhook_event.message && webhook_event.message.text) {
                const text = webhook_event.message.text;
                const senderID = webhook_event.sender.id; // PSID użytkownika (tutaj Twoje lub klienta)
                
                console.log(`Otrzymano odpowiedź z Messengera: ${text}`);

                // ZAPISZ WIADOMOŚĆ, ABY STRONA MOGŁA JĄ POBRAĆ
                // W produkcji tutaj robisz: await db.collection('messages').add({ text, from: 'admin' })
                TEMP_MESSAGES.push({
                    text: text,
                    timestamp: new Date(),
                    from: 'admin'
                });
            }
        }
      });

      return res.status(200).send('EVENT_RECEIVED');
    }
  }

  // 2. ENDPOINT DLA STRONY WWW DO POBIERANIA ODPOWIEDZI (GET)
  // Dodajemy nową obsługę metody GET, aby strona mogła pytać "czy są nowe wiadomości?"
  if (req.method === 'GET') {
      // Weryfikacja Facebooka (pozostawiamy bez zmian)
      if (req.query['hub.mode']) {
          const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
          const mode = req.query['hub.mode'];
          const token = req.query['hub.verify_token'];
          const challenge = req.query['hub.challenge'];
          
          if (mode === 'subscribe' && token === VERIFY_TOKEN) {
              return res.status(200).send(challenge);
          }
          return res.status(403).send('Forbidden');
      }

      // NOWOŚĆ: Jeśli strona pyta o wiadomości
      if (req.query.action === 'get_messages') {
          // Zwracamy wiadomości i czyścimy bufor (prosta kolejka)
          const messagesToSend = [...TEMP_MESSAGES];
          TEMP_MESSAGES = []; // Czyścimy po wysłaniu (aby nie dublować)
          return res.status(200).json({ messages: messagesToSend });
      }
  }

  return res.status(404).send('Not Found');
}
