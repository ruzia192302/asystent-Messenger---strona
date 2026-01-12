(function() {
    // 1. Wygląd (CSS)
    var style = document.createElement('style');
    style.innerHTML = `
        :root { --brand: #23626F; }
        .chat-trigger { position: fixed; bottom: 25px; right: 25px; width: 65px; height: 65px; background: var(--brand); border-radius: 50%; cursor: pointer; z-index: 999999; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: transform 0.3s; }
        .chat-trigger:hover { transform: scale(1.1); }
        .chat-window { position: fixed; bottom: 100px; right: 25px; width: 340px; height: 480px; background: #fff; border-radius: 15px; box-shadow: 0 5px 25px rgba(0,0,0,0.2); display: none; flex-direction: column; z-index: 999999; border: 1px solid #ddd; overflow: hidden; font-family: sans-serif; }
        .chat-header { background: var(--brand); color: #fff; padding: 15px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
        .chat-msgs { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #f9f9f9; }
        .msg-user { align-self: flex-end; background: var(--brand); color: #fff; padding: 8px 12px; border-radius: 15px 15px 0 15px; max-width: 85%; font-size: 14px; }
        .msg-sys { align-self: flex-start; background: #e4e6eb; color: #000; padding: 8px 12px; border-radius: 15px 15px 15px 0; max-width: 85%; font-size: 14px; }
        .input-area { padding: 10px; display: flex; border-top: 1px solid #eee; background: #fff; }
        #userMsg { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 20px; outline: none; }
        #sendBtn { background: none; border: none; color: var(--brand); cursor: pointer; padding: 0 10px; }
        #sendBtn svg { width: 24px; height: 24px; fill: currentColor; }
    `;
    document.head.appendChild(style);

    // 2. Budowa okienka (HTML)
    var div = document.createElement('div');
    div.innerHTML = `
        <div class="chat-trigger" onclick="toggleChat()">💬</div>
        <div class="chat-window" id="cw">
            <div class="chat-header"><span>Asystent Regulski</span><span onclick="toggleChat()" style="cursor:pointer">&times;</span></div>
            <div class="chat-msgs" id="cl"><div class="msg-sys">Dzień dobry! W czym mogę pomóc?</div></div>
            <div class="input-area">
                <input id="userMsg" placeholder="Wpisz wiadomość..." onkeypress="handleKey(event)">
                <button id="sendBtn" onclick="send()"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
            </div>
        </div>
    `;
    document.body.appendChild(div);

    // 3. Logika (JavaScript)
    window.toggleChat = function() {
        var w = document.getElementById('cw');
        w.style.display = w.style.display === 'flex' ? 'none' : 'flex';
    };

    window.handleKey = function(e) {
        if (e.key === 'Enter') send();
    };

    window.send = async function() {
        var inp = document.getElementById('userMsg');
        var txt = inp.value.trim();
        if (!txt) return;

        var list = document.getElementById('cl');
        list.innerHTML += '<div class="msg-user">' + txt + '</div>';
        inp.value = '';
        list.scrollTop = list.scrollHeight;

        try {
            await fetch('https://asystent-messenger-strona.vercel.app/api/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: txt })
            });
        } catch (e) {
            console.error(e); // Cicho ignorujemy błędy, żeby nie straszyć klienta
        }
    };
})();
