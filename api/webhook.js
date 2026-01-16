// api/webhook.js
// WERSJA NAPRAWCZA - KOMPLETNA
// To naprawi "Server Error 500" i pokaże w logach, co się dzieje.

export default async function handler(req, res) {
  
  // 1. Logujemy każde uderzenie do serwera
  console.log("🔔 COŚ PUKA DO SERWERA! Metoda:", req.method);

  // 2. Weryfikacja Facebooka (GET)
  if (req.method === 'GET') {
      // Tu jest wpisane Twoje hasło na sztywno: marcin23
      if (req.query['hub.verify_token'] === 'marcin23') {
          console.log("✅ Facebook weryfikuje token - SUKCES");
          return res.status(200).send(req.query['hub.challenge']);
      }
      return res.status(403).send('Złe hasło');
  }

  // 3. Odbieranie wiadomości (POST)
  if (req.method === 'POST') {
    console.log("📩 Otrzymano dane POST:", JSON.stringify(req.body, null, 2));
    
    const body = req.body;

    // Sytuacja A: Wiadomość ze strony WWW
    if (body.sender === 'user_website') {
        console.log("To wiadomość ze strony WWW!");
        // Tu normalnie wysyłamy do admina, ale na razie tylko logujemy, żeby nie psuć
        return res.status(200).json({ status: 'odebrano_www' });
    }

    // Sytuacja B: Wiadomość z Facebooka (Messenger)
    if (body.object === 'page') {
      console.log("To wiadomość z Facebooka!");
      body.entry.forEach(entry => {
        if (entry.messaging) {
            const webhook_event = entry.messaging[0];
            
            // LOGUJEMY ID NADAWCY (To jest to, czego szukamy!)
            if (webhook_event.sender && webhook_event.sender.id) {
                console.log("🔥 BOMBA! MAMY ID: " + webhook_event.sender.id);
            }
        }
      });
      return res.status(200).send('EVENT_RECEIVED');
    }
  }

  return res.status(200).send('OK');
}
