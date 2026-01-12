export default async function handler(req, res) {
    // Odbieranie wiadomości ze strony
    if (req.method === 'POST') {
        try {
            const body = req.body;
            console.log('✅ OTRZYMANO:', body.message);
            return res.status(200).json({ status: 'ok', received: true });
        } catch (error) {
            return res.status(500).json({ error: 'Błąd' });
        }
    }

    // Weryfikacja (dla Facebooka)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];

        if (mode && token === 'I9JU23NF394R6HH') {
            return res.status(200).send(req.query['hub.challenge']);
        }
        return res.status(403).send('Błąd');
    }

    return res.status(200).send('Działa!');
}
