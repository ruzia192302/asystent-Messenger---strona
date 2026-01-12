// api/webhook.js
import axios from 'axios';

export default async function handler(req, res) {
  
  // 1. WERYFIKACJA WEBHOOKA (Gdy Facebook sprawdza token)
  if (req.method === 'GET') {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        return res.status(200).send(challenge);
      } else {
        return res.status(403).send('Forbidden');
      }
    }
    return res.status(400).send('Bad Request');
  }

  // 2. ODBIERANIE WIADOMOŚCI (POST)
  if (req.method === 'POST') {
    const body = req.body;

    // A. Wiadomość ze strony WWW
    if (body.sender === 'user_website') {
        console.log("Wiadomość od klienta WWW:", body.message);
        // Tutaj w przyszłości dodasz logikę wysyłania do API Messengera
        return res.status(200).json({ status: 'odebrano' });
    }

    // B. Wiadomość z Facebooka
    if (body.object === 'page') {
      // Obsługa zdarzeń z Facebooka (dla weryfikacji)
      return res.status(200).send('EVENT_RECEIVED');
    }

    return res.status(404).send('Not Found');
  }
}