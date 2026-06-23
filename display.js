function formatTime(totalSec) {
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function render(items) {
  const list = document.getElementById("rank-list");
  const empty = document.getElementById("rank-empty");
  if (!items || items.length === 0) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");
  list.innerHTML = items
    .map(
      (entry, index) => `
      <li class="rank-row">
        <span class="rank-pos">${index + 1}</span>
        <span class="rank-name">${escapeHtml(entry.name)}</span>
        <span class="rank-correct">${entry.correct}問正解</span>
        <span class="rank-time">${formatTime(entry.time)}</span>
      </li>`
    )
    .join("");
}

function connect() {
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${protocol}://${location.host}`);
  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === "ranking") render(message.items);
    } catch {
      // ignore malformed message
    }
  };
  ws.onclose = () => setTimeout(connect, 2000);
}

async function showPublicUrl() {
  try {
    const response = await fetch("/api/public-url");
    const data = await response.json();
    if (data.url) document.getElementById("qr-url").textContent = data.url;
  } catch {
    // ignore
  }
}

connect();
showPublicUrl();
