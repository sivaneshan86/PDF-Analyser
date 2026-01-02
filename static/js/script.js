let currentContext = "";

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(`${tab}-panel`).classList.add('active');
}

// Drag & Drop Logic
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('pdf-upload');

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        handleFileUpload(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFileUpload(e.target.files[0]);
    }
});

function handleFileUpload(file) {
    if (file.type !== 'application/pdf') {
        showStatus('Please upload a PDF file.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    showStatus('Processing PDF...', 'loading');

    fetch('/upload_pdf', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            currentContext = data.text;
            showStatus('PDF Processed Successfully', 'success');
            showPreview(currentContext);
            addSystemMessage("I've learned the content of the PDF. What would you like to know?");
        })
        .catch(err => {
            showStatus(err.message, 'error');
        });
}

function processYouTube() {
    const url = document.getElementById('youtube-url').value;
    if (!url) return;

    showStatus('Fetching Transcript...', 'loading');

    fetch('/process_youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            currentContext = data.text;
            showStatus('Transcript Loaded', 'success');
            showPreview(currentContext);
            addSystemMessage("I've watched the video transcript. Ask me anything about it!");
        })
        .catch(err => {
            showStatus(err.message, 'error');
        });
}

function showStatus(msg, type) {
    const statusArea = document.getElementById('status-area');
    const statusText = document.getElementById('status-text');
    const icon = statusArea.querySelector('i');

    statusArea.classList.remove('hidden', 'error');

    if (type === 'error') {
        statusArea.classList.add('error');
        icon.className = 'fa-solid fa-circle-exclamation';
    } else if (type === 'loading') {
        icon.className = 'fa-solid fa-spinner fa-spin';
    } else {
        icon.className = 'fa-solid fa-circle-check';
    }

    statusText.textContent = msg;
}

function showPreview(text) {
    const previewBox = document.getElementById('content-preview');
    const previewText = document.getElementById('preview-text');
    previewBox.classList.remove('hidden');
    previewText.textContent = text.substring(0, 300) + "...";
}

function clearChat() {
    document.getElementById('chat-container').innerHTML = `
        <div class="message ai-welcome">
            <div class="avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="bubble">
                <p>Chat history cleared. I still remember the context though!</p>
            </div>
        </div>
    `;
}

function handleEnter(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    if (!message) return;

    if (!currentContext) {
        showStatus('Please upload PDF or Video first', 'error');
        return;
    }

    // Add User Message
    addMessage(message, 'user');
    input.value = '';

    // Simulate AI thinking
    const loadingId = addLoadingMessage();

    fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: message,
            context: currentContext
        })
    })
        .then(response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiMessageContent = "";

            // Remove loading
            removeMessage(loadingId);
            const msgId = addMessage("", 'ai'); // Empty container

            function read() {
                reader.read().then(({ done, value }) => {
                    if (done) return;
                    const chunk = decoder.decode(value);
                    aiMessageContent += chunk;
                    updateMessage(msgId, aiMessageContent);
                    read();
                });
            }
            read();
        })
        .catch(err => {
            removeMessage(loadingId);
            addSystemMessage("Error: " + err.message);
        });
}

function addMessage(text, role) {
    const container = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = `message ${role === 'user' ? 'user-msg' : ''}`;
    div.id = `msg-${Date.now()}`;

    const avatar = role === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';

    div.innerHTML = `
        <div class="avatar">${avatar}</div>
        <div class="bubble">
            ${role === 'ai' ? marked.parse(text) : `<p>${text}</p>`}
        </div>
    `;

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div.id;
}

function addLoadingMessage() {
    const id = addMessage('<i class="fa-solid fa-ellipsis fa-fade"></i>', 'ai');
    return id;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function updateMessage(id, text) {
    const el = document.getElementById(id);
    if (el) {
        const bubble = el.querySelector('.bubble');
        bubble.innerHTML = marked.parse(text);
        const container = document.getElementById('chat-container');
        container.scrollTop = container.scrollHeight;
    }
}

function addSystemMessage(text) {
    addMessage(text, 'ai');
}
