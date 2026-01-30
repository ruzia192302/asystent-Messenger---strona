const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { kv } = require('@vercel/kv'); // Włączamy bazę danych!

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// -------------------------------------------------------
// WPISZ TUTAJ SWÓJ NUMER ID (Ten z logów)
const ADMIN_ID = "25694094406889787"; 
// -------------------------------------------------------

// --- MESSENGER (Odbieranie od Admina i zapisywanie dla strony) ---
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  let body = req.body;
  if (body.object === 'page') {
    for (const entry of body.entry) {
      let event = entry.messaging ? entry.messaging[0] : null;
      
      if (event && event.message && event.message.text) {
        let text = event.message.text;
        let sender = event.sender.id;
        
        // SPRAWDZAMY KTO PISZE
        if (sender === ADMIN_ID) {
            // TO JESTEŚ TY (ADMIN)!
            // Zapisujemy Twoją odpowiedź w bazie dla strony WWW
            console.log(`👩‍💼 ADMIN ODPISUJE: ${text}`);
            
            // Wrzucamy wiadomość do "szufladki" o nazwie 'chat_replies'
            await kv.lpush('chat_replies', text); 
            
        } else {
            // TO KTOŚ OBCY (np. testujesz z innego konta FB)
            console.log(`👤 KTOŚ NA FB: ${text}`);
        }
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// --- STRONA WWW -> MESSENGER ---
app.post('/api/send_to_admin', (req, res) => {
  const text = req.body.message || req.body.text;
  if (!text) return res.json({ status: 'error' });

  console.log(`🌍 WWW -> ADMIN: ${text}`);

  // Wysyłamy do Ciebie na Messenger
  axios.post(`https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    recipient: { id: ADMIN_ID },
    message: { text: `🌍 WWW: ${text}` }
  }).catch(e => console.error(e));

  res.json({ status: 'ok' });
});

// --- STRONA WWW PYTA O ODPOWIEDŹ (POLLING) ---
app.get('/api/get_reply', async (req, res) => {
  try {
    // Sprawdzamy, czy w bazie są nowe odpowiedzi od Admina
    // rpop zdejmuje wiadomość z listy (żeby nie wyświetlała się w kółko)
    const reply = await kv.rpop('chat_replies');
    
    if (reply) {
        console.log(`📤 WYSYŁAM DO WWW: ${reply}`);
        res.json({ messages: [reply] });
    } else {
        res.json({ messages: [] }); // Pusto, brak nowych wiadomości
    }
  } catch (error) {
      console.error(error);
      res.json({ messages: [] });
  }
});

module.exports = app;
