// api/webhook.js
// WERSJA BEZ AXIOS (Używa wbudowanego fetch - naprawia błąd "Cannot find module")

let TEMP_MESSAGES = []; 

export default async function handler(req, res) {
  
  // CORS - Odblokowanie połączenia dla Twojej strony
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  // Obsługa zapytania wstępnego przeglądarki
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ODBIERANIE WIADOMOŚCI (POST)
  if (req.method === 'POST') {
    const body = req.body;

    // 1. Wiadomość ze strony WWW -> Wyślij do Ciebie na Messenger
    if (body.sender === 'user_website') {
        const userMessage = body.message;
        const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
        const ADMIN_ID = process.env.ADMIN_ID; 

        // Jeśli nie wpisałaś jeszcze ID, tylko logujemy próbę
        if (!ADMIN_ID) {
            console.log("⚠️ BRAK ADMIN_ID - Wiadomość nie zostanie wysłana, ale API działa.");
        } else {
             try {
                // Używamy FETCH zamiast AXIOS (to naprawia Twój błąd)
                const fbResponse = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipient: { id: ADMIN_ID },
                        message: { text: `📢 Klient WWW pisze:\n"${userMessage}"` }
                    })
                });
                
                if (!fbResponse.ok) {
                    const errorData = await fbResponse.json();
                    console.error("Błąd FB:", errorData);
                } else {
                    console.log("Wysłano powiadomienie do Admina");
                }
            } catch (error) {
                console.error("Błąd połączenia:", error.message);
            }
        }
        return res.status(200).json({ status: 'odebrano' });
    }

    // 2. Wiadomość z Facebooka (Gdy Ty piszesz "TEST")
    if (body.object === 'page') {
      body.entry.forEach(entry => {
        if (entry.messaging) {
            const webhook_event = entry.messaging[0];
            
            // --- TUTAJ POJAWI SIĘ TWOJE ID W LOGACH ---
            // Szukaj w logach linijki z zielonym "PTASZKIEM"
            if (webhook_event.sender && webhook_event.sender.id) {
                console.log("✅ TWOJE ID (ADMIN_ID) TO: " + webhook_event.sender.id);
            }
            // ------------------------------------------

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

  // POBIERANIE WIADOMOŚCI PRZEZ STRONĘ (GET)
  if (req.method === 'GET') {
      if (req.query['hub.mode'] === 'subscribe') {
          const VERIFY_TOKEN = process.env.VERIFY_TOKEN; 
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
