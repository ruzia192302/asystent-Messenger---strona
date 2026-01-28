const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// POBIERAMY TWOJE TOKENY Z VERCEL
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Strona startowa (żebyś widziała, że działa w przeglądarce)
app.get('/', (req, res) => {
  res.send('🟢 VERCEL BOT DZIAŁA! (Wersja Express)');
});

// 1. WERYFIKACJA (Dla Facebooka)
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

// 2. ODBIERANIE WIADOMOŚCI
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(function(entry) {
      let webhook_event = entry.messaging ? entry.messaging[0] : null;

      if (webhook_event && webhook_event.message && webhook_event.message.text) {
        let senderId = webhook_event.sender.id;
        let text = webhook_event.message.text;
        
        console.log(`📩 Otrzymano od ${senderId}: ${text}`);

        // ODSYŁANIE WIADOMOŚCI
        axios.post(`https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
          recipient: { id: senderId },
          message: { text: `Odpisuję z Vercel: ${text}` }
        }).catch(err => {
            console.error('❌ BŁĄD:', err.message);
        });
      }
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Eksport dla Vercel
module.exports = app;
