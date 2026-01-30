const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// -------------------------------------------------------
// TU WPISZ SWÓJ NUMER ID (Ten z logów, od którego przyszło "test")
const ADMIN_ID = "25694094406889787"; 
// -------------------------------------------------------

// MESSENGER (Odbieranie i odsyłanie na Messengerze)
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', (req, res) => {
  let body = req.body;
  if (body.object === 'page') {
    body.entry.forEach(entry => {
      let event = entry.messaging ? entry.messaging[0] : null;
      if (event && event.message && event.message.text) {
        let text = event.message.text;
        let sender = event.sender.id;
        
        console.log(`📩 FB OD ${sender}: ${text}`);

        // Tutaj moglibyśmy zapisać odpowiedź do bazy dla strony WWW (Etap 2)
        // Na razie bot po prostu potwierdza na Messengerze
        /*
        axios.post(`https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
           recipient: { id: sender },
           message: { text: `Bot: Otrzymałem "${text}"` }
        }).catch(e => console.error(e));
        */
      }
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// STRONA WWW -> MESSENGER (TO JEST NOWOŚĆ!)
app.post('/api/send_to_admin', (req, res) => {
  const text = req.body.message || req.body.text;
  
  if (!text) return res.json({ status: 'error' });

  console.log(`🌍 WWW PRZEKAZUJĘ DO ADMINA: ${text}`);

  // WYSYŁAMY WIADOMOŚĆ DO CIEBIE NA MESSENGER!
  axios.post(`https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    recipient: { id: ADMIN_ID }, // Wysyłamy do Ciebie
    message: { text: `🌍 KLIENT WWW: ${text}` }
  }).then(() => {
      console.log("✅ Wysłano do Admina na FB");
      res.json({ status: 'ok', reply: 'Wiadomość wysłana do konsultanta' });
  }).catch(err => {
      console.error("❌ Błąd wysyłania na FB:", err.response ? err.response.data : err.message);
      res.json({ status: 'error', reply: 'Błąd serwera' });
  });
});

// Zapytanie o nowe wiadomości (Na razie puste, bo brak bazy)
app.get('/api/get_reply', (req, res) => {
  res.json({ messages: [] });
});

module.exports = app;
