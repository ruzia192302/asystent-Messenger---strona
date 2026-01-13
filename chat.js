(function() {
    // 1. Zdefiniuj kolory i style
    const style = document.createElement('style');
    style.innerHTML = `
        .chat-widget-wrapper * { box-sizing: border-box; }
        .chat-trigger { position: fixed; bottom: 25px; right: 25px; width: 65px; height: 65px; background: #23626F; border-radius: 50%; cursor: pointer; z-index: 999999; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: transform 0.3s; }
        .chat-trigger:hover { transform: scale(1.1); }
        .chat-window { position: fixed; bottom: 100px; right: 25px; width: 340px; height: 480px; background: #fff; border-radius: 15px; box-shadow: 0 5px 25px rgba(0,0,0,0.2); display: none; flex-direction: column; z-index: 999999; border: 1px solid #ddd; overflow: hidden; font-family: sans-serif; }
        .chat-header { background: #23626F; color: #fff; padding: 15px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
        .chat-msgs { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #f9f9f9; }
        .msg-user { align-self: flex-end; background: #23626F; color: #fff; padding: 8px 12px; border-radius: 15px 15px 0 15px; max-width: 85%; font-size: 14px; }
        .msg-sys { align-self: flex-start; background: #e4e6eb; color: #000; padding: 8px 12px; border-radius: 15px 15px 15px 0; max-width: 85%; font-size: 14px; }
        .input-area { padding: 10px; display: flex; border-top: 1px solid #eee; background: #fff; }
        #chatInput { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 20px; outline: none; }
        #chatSendBtn { background: none; border: none; color: #23626F; cursor: pointer; padding: 0 10px; margin-left: 5px; }
        #chatSendBtn svg { width: 24px; height: 24px; fill: currentColor; pointer-events: none; }
    `;
    document.head.appendChild(style);

    // 2. Stwórz HTML (bez onclicków!)
    const container = document.createElement('div');
    container.className = 'chat-widget-wrapper';
    container.innerHTML = `
        <div class="chat-trigger" id="chatTrigger">💬</div>
        <div class="chat-window" id="chatWindow">
            <div class="chat-header"><span>Asystent Regulski</span><span id="chatClose" style="cursor:pointer">&times;</span></div>
            <div class="chat-msgs" id="chatList"><div class="msg-sys">Dzień dobry! W czym mogę pomóc?</div></div>
            <div class="input-area">
                <input id="chatInput" type="text" placeholder="Wpisz wiadomość...">
                <button id="chatSendBtn">
                    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    // 3. Podłącz logikę (Super Klej JavaScript)
    const trigger = document.getElementById('chatTrigger');
    const win = document.getElementById('chatWindow');
    const close = document.getElementById('chatClose');
    const input = document.getElementById('chatInput');
    const btn = document.getElementById('chatSendBtn');
    const list = document.getElementById('chatList');

    // Otwieranie/Zamykanie
    function toggle() {
        win.style.display = win.style.display === 'flex' ? 'none' : 'flex';
        if(win.style.display === 'flex') input.focus();
    }
    trigger.addEventListener('click', toggle);
    close.addEventListener('click', toggle);

    // Wysyłanie
    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        console.log('🚀 Próba wysłania:', text); // To zobaczysz w konsoli!

        // Pokaż wiadomość na ekranie
        list.innerHTML += `<div class="msg-user">${text}</div>`;
        input.value = '';
        list.scrollTop = list.scrollHeight;

        // Wyślij do Vercel
        try {
            await fetch('https://asystent-messenger-strona.vercel.app/api/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            console.log('✅ Wysłano do serwera!');
        } catch (err) {
            console.error('❌ Błąd wysyłania:', err);
        }
    }

    // Podłącz przycisk i Enter
    btn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage();
    });

})();
