import axios from 'axios';

let TEMP_MESSAGES = []; 

export default async function handler(req, res) {
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const body = req.body;

    // 1. Wiadomość ze strony -> do Messengera
    if (body.sender === 'user_website') {
        const userMessage = body.message;
        const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
        const ADMIN_ID = process.env.ADMIN_ID; 

        // Jeśli nie ma ID, tylko logujemy próbę (żeby nie wywaliło błędu)
        if (!ADMIN_ID) {
            console.log("BRAK ADMIN_ID - Wiadomość nie zostanie wysłana do Messengera, ale API działa.");
        } else {
             try {
                await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
                    recipient: { id: ADMIN_ID },
                    message: { text: `📢 Klient WWW pisze:\n"${userMessage}"` }
                });
            } catch (error) {
                console.error("Błąd FB:", error.message);
            }
        }
        return res.status(200).json({ status: 'odebrano' });
    }

    // 2. Wiadomość z Facebooka
    if (body.object === 'page') {
      body.entry.forEach(entry => {
        if (entry.messaging) {
            const webhook_event = entry.messaging[0];
            
            // --- TUTAJ JEST TA WAŻNA ZMIANA ---
            if (webhook_event.sender && webhook_event.sender.id) {
                console.log("!!! TWOJE ID (ADMIN_ID) TO: " + webhook_event.sender.id + " !!!");
            }
            // ----------------------------------

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
