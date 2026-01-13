export default async function handler(req, res) {
    // --- KONFIGURACJA ---
    const VERIFY_TOKEN = 'I9JU23NF394R6HH'; // Hasło dla Facebooka
    const PAGE_ACCESS_TOKEN = 'EAANDHAkTYvIBQRL40wyZC3tGmFOCG6eNQNZCQ4VJYua7rg6XfTNuSTstZAJa42CiH6fmx6BXTSkCIvZAuO2XBZBGvB3w712lx3SsPZCVhC7s1VESQcScXhmmyypYCCZAUWjpu3MFw8ZAscIKjPkQCogN5h7AzBmLXc4dAtB7mVTwUFO8friXRgBiyzSIhTT1C0filZCj03HtRiAZDZD';

    // 1. ZGODA NA POŁĄCZENIE (Dla Twojej strony)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 2. WERYFIKACJA (To jest kluczowe dla kroku na Facebooku!)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode && token === VERIFY_TOKEN) {
            return res.status(200).send(challenge);
        }
        return res.status(403).send('Błąd weryfikacji');
    }

    // 3. ODBIERANIE WIADOMOŚCI (Ze strony WWW)
    if (req.method === 'POST') {
        try {
            const body = req.body;
            console.log('📨 Nowa wiadomość ze strony:', body.message);
            
            // Tutaj Vercel odbiera wiadomość.
            // W następnym etapie dodamy tu kod, który przesyła ją dalej na Messenger.
            
            return res.status(200).json({ status: 'ok' });
        } catch (error) {
            console.error('Błąd:', error);
            return res.status(500).json({ error: 'Błąd serwera' });
        }
    }

    return res.status(200).send('Serwer Vercel działa poprawnie!');
}
