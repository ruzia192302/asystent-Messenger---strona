// Wersja BEZ błędów - korzysta tylko z tego, co Vercel ma w standardzie
export default async function handler(req, res) {
    // 1. Weryfikacja (żeby Facebook mógł się połączyć)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        
        // Twój token weryfikacyjny
        const MY_VERIFY_TOKEN = 'I9JU23NF394R6HH';

        if (mode && token === MY_VERIFY_TOKEN) {
            return res.status(200).send(challenge);
        }
        return res.status(403).send('Błąd weryfikacji');
    }

    // 2. Odbieranie wiadomości ze strony WWW
    if (req.method === 'POST') {
        const body = req.body;
        console.log('✅ OTRZYMANO:', body.message);
        return res.status(200).json({ status: 'ok' });
    }

    return res.status(200).send('Asystent gotowy');
}
