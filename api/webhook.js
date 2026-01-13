export default async function handler(req, res) {
    // --- TWOJE DANE KONFIGURACYJNE ---
    const VERIFY_TOKEN = 'I9JU23NF394R6HH';
    const PAGE_ACCESS_TOKEN = 'EAANDHAkTYvIBQRL40wyZC3tGmFOCG6eNQNZCQ4VJYua7rg6XfTNuSTstZAJa42CiH6fmx6BXTSkCIvZAuO2XBZBGvB3w712lx3SsPZCVhC7s1VESQcScXhmmyypYCCZAUWjpu3MFw8ZAscIKjPkQCogN5h7AzBmLXc4dAtB7mVTwUFO8friXRgBiyzSIhTT1C0filZCj03HtRiAZDZD';
    const MOJE_ID = '25694094406889787'; // Twój numer, który znalazłaś!

    // 1. Nagłówki (żeby strona nie krzyczała o błędach)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 2. Weryfikacja Facebooka (musi zostać, żeby nie rozłączyło)
    if (req.method === 'GET') {
        if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
            return res.status(200).send(req.query['hub.challenge']);
        }
        return res.status(403).send('Błąd weryfikacji');
    }

    // 3. GŁÓWNA FUNKCJA: PRZEKAZYWANIE WIADOMOŚCI
    if (req.method === 'POST') {
        try {
            const body = req.body;

            // A) Jeśli wiadomość przychodzi ze STRONY WWW (od klienta)
            if (body.message) {
                console.log('📨 Klient pisze:', body.message);

                // Wyślij to na Twój Messenger!
                await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipient: { id: MOJE_ID },
                        message: { text: `🔔 KLIENT ZE STRONY:\n"${body.message}"` }
                    })
                });
                
                return res.status(200).json({ status: 'wyslano' });
            }

            // B) Jeśli to Facebook sprawdza połączenie (ping)
            if (body.object === 'page') {
                return res.status(200).send('EVENT_RECEIVED');
            }

            return res.status(200).json({ status: 'ok' });

        } catch (error) {
            console.error('Błąd:', error);
            return res.status(500).json({ error: 'Ups, coś poszło nie tak' });
        }
    }
}
