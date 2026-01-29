const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors'); // Dodajemy, żeby strona WWW mogła się łączyć

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Zezwolenie na połączenie z innej strony (CORS)

// ZMIENNE
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// 1. STRONA GŁÓWNA
app.get('/', (req, res) => {
  res.send('🟢 VERCEL BOT DZIAŁA! Messenger + API Strony');
});

// 2. WERYFIKACJA FACEBOOKA
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ WEBHOOK ZWERYFIKOWANY!');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// 3. ODBIERANIE WIADOMOŚCI Z MESSENGERA
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(function(entry) {
      let webhook_event = entry.messaging ? entry.messaging[0] : null;

      if (webhook_event && webhook_event.message && webhook_event.message.text) {
        let senderId = webhook_event.sender.id;
        let text = webhook_event.message.text;
        
        console.log(`📩 FB MSG: ${text} od ${senderId}`);

        // Odpowiedź na FB
        axios.post(`https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
          recipient: { id: senderId },
          message: { text: `Vercel odpisuje: ${text}` }
        }).catch(err => console.error('❌ BŁĄD FB:', err.message));
      }
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// 4. OBSŁUGA STRONY WWW (To naprawi czerwone błędy 404)
// Ponieważ nie mamy bazy danych, zrobimy prostą symulację, żeby błędy zniknęły.

app.get('/api/get_reply', (req, res) => {
  // Widget pyta: "Czy są nowe wiadomości?"
  // Odpowiadamy pustą listą, bo bez bazy danych nie mamy gdzie ich trzymać
  res.status(200).json({ messages: [] });
});

app.post('/api/send_to_admin', (req, res) => {
  // Widget wysyła wiadomość do Ciebie
  const { text } = req.body;
  console.log(`🌍 WWW MSG: ${text}`);
  
  // Tu można dodać logikę wysyłania powiadomienia, na razie potwierdzamy odbiór
  res.status(200).json({ status: 'ok', reply: 'Wiadomość dotarła do serwera (bez bazy danych)' });
});

module.exports = app;
