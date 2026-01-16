// api/webhook.js
// WERSJA Z HASŁEM "marcin23" WPISANYM NA SZTYWNO

let TEMP_MESSAGES = []; 

export default async function handler(req, res) {
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ODBIERANIE WIADOMOŚCI (POST)
  if (req.method === 'POST') {
    const body = req.body;

    if (body.sender === 'user_website') {
        const userMessage = body.message;
        const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
        const ADMIN_ID = process.env.ADMIN_ID; 

        if (!ADMIN_ID) {
            console.log("⚠️ BRAK ADMIN_ID");
        } else {
             try {
                const fbResponse = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipient: { id: ADMIN_ID },
                        message: { text: `📢 Klient WWW pisze:\n"${userMessage}"` }
                    })
                });
                if (!fbResponse.ok) console.error("Błąd FB");
            } catch (error) {
                console.error("Błąd połączenia:", error.message);
            }
        }
        return res.status(200).json({ status: 'odebrano' });
    }

    if (body.object === 'page') {
      body.entry.forEach(entry => {
        if (entry.messaging) {
            const webhook_event = entry.messaging[0];
            if (webhook_event.sender && webhook_event.sender.id) {
                console.log("✅ TWOJE ID (ADMIN_ID) TO: " + webhook_event.sender.id);
            }
            if (webhook_event.message && !webhook_event.message.is_echo && webhook_event.message.text) {
                const text = webhook_event.message.text;
                console.log(`Admin odpisał: ${text}`);
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

  // WERYFIKACJA (GET) - TO TUTAJ NAPRAWIAMY BŁĄD
  if (req.method === 'GET') {
      if (req.query['hub.mode'] === 'subscribe') {
          
          // UWAGA: Tutaj wpisałem hasło na sztywno, żeby pasowało do Facebooka
          const VERIFY_TOKEN = 'marcin23'; 
          
          if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
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
