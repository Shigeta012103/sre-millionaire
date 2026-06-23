const RANK_LIMIT = 50;

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

function sortEntries(entries) {
  return entries.sort(
    (a, b) => b.correct - a.correct || a.time - b.time || a.ts - b.ts
  );
}

const MEDALS = ["🥇", "🥈", "🥉"];

function rankRowHtml(entry, index) {
  const topClass = index < 3 ? ` rank-${index + 1}` : "";
  const pos = index < 3 ? MEDALS[index] : index + 1;
  const company = entry.company
    ? `<span class="rank-company">${escapeHtml(entry.company)}</span>`
    : "";
  return `
    <li class="rank-row${topClass}">
      <span class="rank-pos">${pos}</span>
      <span class="rank-name"><span class="rank-player">${escapeHtml(entry.name)}</span>${company}</span>
      <span class="rank-correct">${entry.correct}問正解</span>
      <span class="rank-time">${formatTime(entry.time)}</span>
    </li>`;
}

function renderRanking(entries) {
  const list = document.getElementById("rank-list");
  list.innerHTML = entries.slice(0, RANK_LIMIT).map(rankRowHtml).join("");
}

function showEmpty(message) {
  const empty = document.getElementById("rank-empty");
  empty.textContent = message;
  empty.classList.remove("hidden");
}

async function loadRanking() {
  if (!RANKING_API_URL) {
    showEmpty("ランキングは準備中です");
    return;
  }
  try {
    const response = await fetch(RANKING_API_URL);
    if (!response.ok) throw new Error("fetch failed");
    const data = await response.json();
    const entries = Array.isArray(data) ? data : data.items || [];
    if (entries.length === 0) {
      showEmpty("まだ記録がありません");
      return;
    }
    renderRanking(sortEntries(entries));
  } catch (error) {
    showEmpty("ランキングの取得に失敗しました");
  }
}

loadRanking();
