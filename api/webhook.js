export default async function handler(req, res) {
    // === 1. ZGODA NA POŁĄCZENIE (TO NAPRAWIA BŁĄD W DYMKU) ===
    // Te linijki mówią przeglądarce: "Możesz do mnie wysyłać wiadomości!"
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Jeśli przeglądarka tylko "puka" zapytać czy wolno (OPTIONS), odpowiadamy: "Tak, wchodź!"
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // === 2. ODBIERANIE WIADOMOŚCI ===
    if (req.method === 'POST') {
        try {
            const body = req.body;
            console.log('✅ OTRZYMANO:', body.message); // To zobaczysz w logach Vercel
            return res.status(200).json({ status: 'ok', received: true });
        } catch (error) {
            return res.status(500).json({ error: 'Błąd serwera' });
        }
    }

    // === 3. WERYFIKACJA (DLA FACEBOOKA) ===
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        
        if (mode && token === 'I9JU23NF394R6HH') {
            return res.status(200).send(challenge);
        }
        return res.status(403).send('Błąd weryfikacji');
    }

    return res.status(200).send('Asystent gotowy!');
}
