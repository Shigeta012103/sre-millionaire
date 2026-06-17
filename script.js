const CHOICE_LABELS = ["A", "B", "C", "D"];
const SELECT_FLASH_MS = 1400;
const REVEAL_HOLD_MS = 1600;
const YEN_UNIT = 10000;
const BASE_AUDIENCE_BIAS = 70;
const BIAS_DECAY_PER_QUESTION = 2.5;
const MIN_CORRECT_BIAS = 35;

const DEFAULT_PLAYER_NAME = "挑戦者";

const dom = {
  questionText: document.getElementById("question-text"),
  choices: document.getElementById("choices"),
  prizeAmount: document.getElementById("prize-amount"),
  playerName: document.getElementById("player-name"),
  nameInput: document.getElementById("player-name-input"),
  fiftyFifty: document.getElementById("lifeline-5050"),
  phone: document.getElementById("lifeline-phone"),
  audience: document.getElementById("lifeline-audience"),
  startScreen: document.getElementById("start-screen"),
  startBtn: document.getElementById("start-btn"),
  resultScreen: document.getElementById("result-screen"),
  resultTitle: document.getElementById("result-title"),
  resultPrize: document.getElementById("result-prize"),
  restartBtn: document.getElementById("restart-btn"),
  modal: document.getElementById("modal"),
  modalTitle: document.getElementById("modal-title"),
  modalBody: document.getElementById("modal-body"),
  modalClose: document.getElementById("modal-close"),
};

const state = {
  currentIndex: 0,
  locked: false,
  lifelines: { fiftyFifty: false, phone: false, audience: false },
};

function formatPrize(amount) {
  return `${(amount / YEN_UNIT).toLocaleString("ja-JP")}万円`;
}

function formatYen(amount) {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

function lastClearedPrize() {
  const reachedSafety = SAFETY_LINE_INDICES.filter((index) => index < state.currentIndex);
  if (reachedSafety.length === 0) return 0;
  return PRIZE_AMOUNTS[Math.max(...reachedSafety)];
}

function updatePrizeBanner() {
  dom.prizeAmount.textContent = formatYen(PRIZE_AMOUNTS[state.currentIndex]);
}

function renderQuestion() {
  const question = QUIZ_QUESTIONS[state.currentIndex];
  dom.questionText.textContent = question.text;
  dom.choices.innerHTML = "";
  question.choices.forEach((choiceText, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.dataset.index = String(index);
    button.innerHTML = `<span class="letter">${CHOICE_LABELS[index]}</span><span>${choiceText}</span>`;
    button.addEventListener("click", () => onChoiceClick(index));
    item.appendChild(button);
    dom.choices.appendChild(item);
  });
  updatePrizeBanner();
}

function getChoiceButtons() {
  return Array.from(dom.choices.querySelectorAll(".choice"));
}

function onChoiceClick(selectedIndex) {
  if (state.locked) return;
  state.locked = true;
  const buttons = getChoiceButtons();
  buttons.forEach((button) => (button.disabled = true));
  const selectedButton = buttons[selectedIndex];
  selectedButton.classList.add("selected");
  setTimeout(() => revealAnswer(selectedIndex, buttons), SELECT_FLASH_MS);
}

function revealAnswer(selectedIndex, buttons) {
  const answerIndex = QUIZ_QUESTIONS[state.currentIndex].answerIndex;
  const selectedButton = buttons[selectedIndex];
  selectedButton.classList.remove("selected");
  buttons[answerIndex].classList.add("correct");
  if (selectedIndex !== answerIndex) selectedButton.classList.add("wrong");
  const isCorrect = selectedIndex === answerIndex;
  setTimeout(() => advanceAfterReveal(isCorrect), REVEAL_HOLD_MS);
}

function advanceAfterReveal(isCorrect) {
  if (!isCorrect) {
    finishGame(false);
    return;
  }
  const isFinalQuestion = state.currentIndex === QUIZ_QUESTIONS.length - 1;
  if (isFinalQuestion) {
    finishGame(true);
    return;
  }
  state.currentIndex += 1;
  state.locked = false;
  renderQuestion();
}

function disableLifeline(button, key) {
  button.classList.add("used");
  button.disabled = true;
  state.lifelines[key] = true;
}

function useFiftyFifty() {
  if (state.lifelines.fiftyFifty || state.locked) return;
  disableLifeline(dom.fiftyFifty, "fiftyFifty");
  const answerIndex = QUIZ_QUESTIONS[state.currentIndex].answerIndex;
  const wrongIndices = getChoiceButtons()
    .map((_, index) => index)
    .filter((index) => index !== answerIndex)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);
  const buttons = getChoiceButtons();
  wrongIndices.forEach((index) => {
    buttons[index].classList.add("hidden-choice");
    buttons[index].disabled = true;
  });
}

function usePhone() {
  if (state.lifelines.phone || state.locked) return;
  disableLifeline(dom.phone, "phone");
  openModal("オンコール仲間に電話", `<p>「${QUIZ_QUESTIONS[state.currentIndex].friendHint}」</p>`);
}

function buildAudienceVotes(answerIndex, questionIndex) {
  const correctBias = Math.max(MIN_CORRECT_BIAS, BASE_AUDIENCE_BIAS - questionIndex * BIAS_DECAY_PER_QUESTION);
  const votes = [0, 0, 0, 0];
  votes[answerIndex] = Math.round(correctBias);
  let remaining = 100 - votes[answerIndex];
  const wrongIndices = [0, 1, 2, 3].filter((index) => index !== answerIndex);
  wrongIndices.forEach((index, position) => {
    const isLast = position === wrongIndices.length - 1;
    const share = isLast ? remaining : Math.floor(Math.random() * (remaining / 2));
    votes[index] = share;
    remaining -= share;
  });
  return votes;
}

function useAudience() {
  if (state.lifelines.audience || state.locked) return;
  disableLifeline(dom.audience, "audience");
  const answerIndex = QUIZ_QUESTIONS[state.currentIndex].answerIndex;
  const votes = buildAudienceVotes(answerIndex, state.currentIndex);
  const bars = votes
    .map(
      (pct, index) => `
      <div class="audience-bar">
        <span class="bar-pct">${pct}%</span>
        <div class="bar" style="height:${pct}%"></div>
        <span class="bar-letter">${CHOICE_LABELS[index]}</span>
      </div>`
    )
    .join("");
  openModal("チームに聞く", `<div class="audience-bars">${bars}</div>`);
}

function openModal(title, bodyHtml) {
  dom.modalTitle.textContent = title;
  dom.modalBody.innerHTML = bodyHtml;
  dom.modal.classList.remove("hidden");
}

function closeModal() {
  dom.modal.classList.add("hidden");
}

function finishGame(isWinner) {
  const prize = isWinner ? PRIZE_AMOUNTS[PRIZE_AMOUNTS.length - 1] : lastClearedPrize();
  dom.resultTitle.textContent = isWinner ? "🎉 全問正解！" : "ゲームオーバー";
  dom.resultPrize.textContent = `獲得賞金: ${prize === 0 ? "0円" : formatPrize(prize)}`;
  dom.resultScreen.classList.remove("hidden");
}

function startGame() {
  state.currentIndex = 0;
  state.locked = false;
  state.lifelines = { fiftyFifty: false, phone: false, audience: false };
  dom.playerName.textContent = dom.nameInput.value.trim() || DEFAULT_PLAYER_NAME;
  [dom.fiftyFifty, dom.phone, dom.audience].forEach((button) => {
    button.classList.remove("used");
    button.disabled = false;
  });
  dom.startScreen.classList.add("hidden");
  dom.resultScreen.classList.add("hidden");
  renderQuestion();
}

dom.startBtn.addEventListener("click", startGame);
dom.restartBtn.addEventListener("click", startGame);
dom.fiftyFifty.addEventListener("click", useFiftyFifty);
dom.phone.addEventListener("click", usePhone);
dom.audience.addEventListener("click", useAudience);
dom.modalClose.addEventListener("click", closeModal);
