const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Konfiguracja, żeby Vercel rozumiał dane ze strony
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// MESSENGER (To działa, nie ruszamy)
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
        console.log(`📩 FB MSG: ${text}`);
        axios.post(`https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
          recipient: { id: sender },
          message: { text: `Vercel: ${text}` }
        }).catch(e => console.error(e.message));
      }
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// STRONA WWW (To naprawi błąd undefined)
app.get('/api/get_reply', (req, res) => {
  res.json({ messages: [] });
});

app.post('/api/send_to_admin', (req, res) => {
  // LOGOWANIE BŁĘDÓW - Żebyś widziała co przychodzi
  console.log("📦 PEŁNA ZAWARTOŚĆ BODY:", JSON.stringify(req.body));

  const text = req.body.message || req.body.text;
  
  if (!text) {
    return res.json({ status: 'ok', reply: 'Pusto, ale serwer działa' });
  }

  console.log(`✅ SUKCES WWW: ${text}`);
  res.json({ status: 'ok', reply: 'Wiadomość dotarła!' });
});

module.exports = app;
