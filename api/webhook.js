// api/webhook.js
let TEMP_MESSAGES = []; 

export default async function handler(req, res) {
  
  // --- SEKCJA CORS (TO JEST NOWE - ODBLOKOWUJE POŁĄCZENIE) ---
  res.setHeader('Access-Control-Allow-Origin', '*'); // Pozwala każdemu (lub wpisz tu domenę swojej strony)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  // Obsługa zapytania wstępnego (przeglądarka pyta: "czy mogę wysłać?")
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // -----------------------------------------------------------

  // 1. ODBIERANIE WIADOMOŚCI OD STRONY WWW (POST)
  if (req.method === 'POST') {
    const body = req.body;

    if (body.sender === 'user_website') {
        console.log("Wiadomość od klienta WWW:", body.message);
        return res.status(200).json({ status: 'odebrano' });
    }

    if (body.object === 'page') {
      body.entry.forEach(entry => {
        if (entry.messaging) {
            let webhook_event = entry.messaging[0];
            if (webhook_event.message && webhook_event.message.text) {
                const text = webhook_event.message.text;
                console.log(`Otrzymano odpowiedź z Messengera: ${text}`);
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

  // 2. ENDPOINT DO POBIERANIA ODPOWIEDZI (GET)
  if (req.method === 'GET') {
      if (req.query['hub.mode']) {
          const VERIFY_TOKEN = 'marcin23';
          if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
              return res.status(200).send(req.query['hub.challenge']);
          }
          return res.status(403).send('Forbidden');
      }

      if (req.query.action === 'get_messages') {
          const messagesToSend = [...TEMP_MESSAGES];
          TEMP_MESSAGES = []; 
          return res.status(200).json({ messages: messagesToSend });
      }
  }

  return res.status(404).send('Not Found');
}


