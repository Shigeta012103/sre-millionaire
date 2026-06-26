const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");
const QRCode = require("qrcode");

const PORT = process.env.PORT || 5180;
const ROOT = path.join(__dirname, "..");
const DATA_FILE = path.join(__dirname, "scores.json");
const MAX_ITEMS = 50;
const MAX_NAME_LENGTH = 20;
const MAX_COMPANY_LENGTH = 30;
const MAX_CORRECT = 100;
const MAX_TIME_SEC = 100000;
const NGROK_INSPECT_PORTS = [4040, 4041, 4042, 4043];

function clampInt(value, min, max) {
  const num = Math.floor(Number(value));
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, num));
}

function loadScores() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveScores(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

let scores = loadScores();

function ranking() {
  return [...scores]
    .sort((a, b) => b.correct - a.correct || a.time - b.time || a.ts - b.ts)
    .slice(0, MAX_ITEMS);
}

function matchesThisPort(tunnel) {
  const addr = tunnel?.config?.addr ?? "";
  return addr.endsWith(`:${PORT}`);
}

// 複数の ngrok が起動している場合、検査API(4040〜)は先勝ちで別エージェントが占有する。
// 検査ポートを走査し「このサーバのポート(PORT)に向いたトンネル」を選ぶ。
async function getPublicUrl() {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL;
  for (const port of NGROK_INSPECT_PORTS) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/tunnels`);
      const data = await response.json();
      const tunnels = data.tunnels ?? [];
      const match =
        tunnels.find((t) => matchesThisPort(t) && t.proto === "https") ||
        tunnels.find((t) => matchesThisPort(t));
      if (match) return match.public_url;
    } catch {
      // この検査ポートは未使用 → 次へ
    }
  }
  return null;
}

const app = express();
app.use(express.json());

// ローカル配信時はフロントの RANKING_API_URL をローカルAPIへ向ける（静的 config.js を上書き）
app.get("/config.js", (req, res) => {
  res.type("application/javascript").send('const RANKING_API_URL = "/api/ranking";\n');
});

app.get("/api/ranking", (req, res) => {
  res.json({ items: ranking() });
});

app.post("/api/ranking", (req, res) => {
  const { name, company, correct, time } = req.body || {};
  const entry = {
    name: String(name ?? "").trim().slice(0, MAX_NAME_LENGTH) || "挑戦者",
    company: String(company ?? "").trim().slice(0, MAX_COMPANY_LENGTH),
    correct: clampInt(correct, 0, MAX_CORRECT),
    time: clampInt(time, 0, MAX_TIME_SEC),
    ts: Date.now(),
  };
  scores.push(entry);
  saveScores(scores);
  broadcast({ type: "ranking", items: ranking() });
  res.status(201).json({ ok: true });
});

app.get("/api/public-url", async (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ url: await getPublicUrl() });
});

app.get("/api/qr", async (req, res) => {
  const url = await getPublicUrl();
  res.set("Cache-Control", "no-store");
  if (!url) return res.status(404).send("public url not found");
  res.type("png");
  QRCode.toFileStream(res, url, { width: 360, margin: 1 });
});

app.use(express.static(ROOT));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "ranking", items: ranking() }));
});

function broadcast(message) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(data);
  });
}

server.listen(PORT, () => {
  console.log(`SRE millionaire server listening on http://localhost:${PORT}`);
  console.log(`Monitor/display: http://localhost:${PORT}/display.html`);
});
