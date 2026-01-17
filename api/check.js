import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Pobierz wszystkie wiadomości z listy
  const messages = await kv.lrange('chat_messages', 0, -1);
  
  if (messages && messages.length > 0) {
      // Jeśli są wiadomości, wyczyść je z bazy (żeby nie wyświetlać ich 2 razy)
      await kv.del('chat_messages');
      
      // Zwróć wiadomości do widgetu na stronie
      return res.status(200).json({ messages: messages.map(m => typeof m === 'string' ? JSON.parse(m) : m) });
  }

  // Jeśli brak wiadomości
  return res.status(200).json({ messages: [] });
}
