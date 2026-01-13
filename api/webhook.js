// Prosta pamięć podręczna (działa dopóki serwer Vercel nie uśnie)
let ostatniaWiadomoscDlaKlienta = null;

export default async function handler(req, res) {
    const VERIFY_TOKEN = 'I9JU23NF394R6HH';
    const PAGE_ACCESS_TOKEN = 'EAANDHAkTYvIBQRL40wyZC3tGmFOCG6eNQNZCQ4VJYua7rg6XfTNuSTstZAJa42CiH6fmx6BXTSkCIvZAuO2XBZBGvB3w712lx3SsPZCVhC7s1VESQcScXhmmyypYCCZAUWjpu3MFw8ZAscIKjPkQCogN5h7AzBmLXc4dAtB7mVTwUFO8friXRgBiyzSIhTT1C0filZCj03HtRiAZDZD';
    const MOJE_PRYWATNE_ID = '25694094406889787';

    // 1. Obsługa Pollingu (Strona pyta: "Czy są nowe wiadomości?")
    // To jest ten fragment, którego brakowało!
    if (req.method === 'GET' && req.query.check_messages === 'true') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        if (ostatniaWiadomoscDlaKlienta) {
            const msg = ostatniaWiadomoscDlaKlienta;
            ostatniaWiadomoscDlaKlienta = null; // Wyczyszczenie po odebraniu
            return res.status(200).json({ nowe: true, tekst: msg });
        } else {
            return res.status(200).json({ nowe: false });
        }
    }

    // 2. Weryfikacja Facebooka (standardowa)
    if (req.method === 'GET') {
        if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
            return res.status(200).send(req.query['hub.challenge']);
        }
        return res.status(403).send('Błąd weryfikacji');
    }

    // 3. Obsługa POST (Wiadomości przychodzące)
    if (req.method === 'POST') {
        const body = req.body;

        // A) Wiadomość ze STRONY -> do Ciebie (Messenger)
        if (body.message) {
            await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: { id: MOJE_PRYWATNE_ID },
                    message: { text: `STRONA: ${body.message}` }
                })
            });
            return res.status(200).json({ status: 'ok' });
        }

        // B) Wiadomość z MESSENGERA -> do Strony (Zapisujemy w zmiennej)
        if (body.object === 'page') {
            const messaging = body.entry[0].messaging[0];
            if (messaging.sender.id === MOJE_PRYWATNE_ID && messaging.message) {
                const tekstOdNatalii = messaging.message.text;
                console.log('Odebrano od Natalii:', tekstOdNatalii);
                
                // ZAPISUJEMY W "PAMIĘCI", ŻEBY STRONA MOGŁA TO POBRAĆ
                ostatniaWiadomoscDlaKlienta = tekstOdNatalii;
            }
            return res.status(200).send('EVENT_RECEIVED');
        }
        return res.status(404).send();
    }
}
