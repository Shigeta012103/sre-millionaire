const CHOICE_LABELS = ["A", "B", "C", "D"];
const SELECT_FLASH_MS = 5000;
const REVEAL_HOLD_MS = 1600;
const QUESTION_NUMBER_ANIM_MS = 2000;
const TYPE_CHAR_MS = 90;
const CHOICE_REVEAL_MS = 1000;
const CHOICES_START_DELAY_MS = 1000;
const ANSWER_TIME_SEC = 15;
const TIMER_WARNING_SEC = 5;
const ANSWERING_RELEASE_MS = 1000;
const LADDER_HOLD_BEFORE_MS = 900;
const LADDER_MOVE_MS = 500;
const LADDER_HOLD_AFTER_MS = 800;
const YEN_UNIT = 10000;

const DEFAULT_PLAYER_NAME = "挑戦者";

const dom = {
  questionText: document.getElementById("question-text"),
  questionNumber: document.getElementById("question-number"),
  questionNumberText: document.getElementById("question-number-text"),
  choices: document.getElementById("choices"),
  timer: document.getElementById("timer"),
  timerNum: document.getElementById("timer-num"),
  timerProgress: document.getElementById("timer-progress"),
  ladderOverlay: document.getElementById("ladder-overlay"),
  ladderList: document.getElementById("ladder-list"),
  ladderCursor: document.getElementById("ladder-cursor"),
  characters: document.querySelectorAll(".mc-character"),
  // デバッグ用（再有効化する場合は下記2行を戻す）
  // debugLabel: document.getElementById("debug-label"),
  // debugButtons: document.getElementById("debug-buttons"),
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
  questions: [],
  currentChoices: [],
  currentIndex: 0,
  answerIndex: 0,
  locked: false,
  totalTimeSec: 0,
  lastAnswerSec: 0,
  lifelines: { fiftyFifty: false, phone: false, audience: false },
};

let timerIntervalId = null;
let timeRemaining = 0;

// デバッグUIが存在する間はカウントダウンを止める
const DEBUG_MODE = Boolean(dom.debugButtons);

function formatPrize(amount) {
  return `${(amount / YEN_UNIT).toLocaleString("ja-JP")}万円`;
}

function formatYen(amount) {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

function setCharacter(mood) {
  dom.characters.forEach((img) => {
    img.classList.toggle("is-active", img.dataset.mood === mood);
  });
  // デバッグ用（再有効化する場合は下記1行を戻す）
  // dom.debugLabel.textContent = `状態: ${mood} / Q${state.currentIndex + 1}`;
}

function lastClearedPrize() {
  const reachedSafety = SAFETY_LINE_INDICES.filter((index) => index < state.currentIndex);
  if (reachedSafety.length === 0) return 0;
  return PRIZE_AMOUNTS[Math.max(...reachedSafety)];
}

function updatePrizeBanner() {
  const securedAmount = state.currentIndex === 0 ? 0 : PRIZE_AMOUNTS[state.currentIndex - 1];
  dom.prizeAmount.textContent = formatYen(securedAmount);
}

function pickRandom(pool, count) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function buildQuizSet() {
  const difficulties = ["easy", "medium", "hard"];
  return difficulties.flatMap((difficulty) => {
    const pool = QUIZ_QUESTIONS.filter((question) => question.difficulty === difficulty);
    return pickRandom(pool, QUESTIONS_PER_DIFFICULTY);
  });
}

function buildShuffledChoices(question) {
  const entries = question.choices.map((choice) => ({ ...choice }));
  for (let i = entries.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }
  return entries;
}

function buildChoiceButtons(entries) {
  dom.choices.innerHTML = "";
  entries.forEach((entry, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice pre-reveal";
    button.disabled = true;
    button.dataset.index = String(index);
    button.innerHTML = `<span class="letter">${CHOICE_LABELS[index]}</span><span>${entry.text}</span>`;
    button.addEventListener("click", () => onChoiceClick(index));
    item.appendChild(button);
    dom.choices.appendChild(item);
  });
}

function playQuestionNumber(done) {
  dom.questionNumberText.textContent = `第${state.currentIndex + 1}問`;
  dom.questionNumber.classList.remove("play");
  void dom.questionNumber.offsetWidth;
  dom.questionNumber.classList.add("play");
  setTimeout(done, QUESTION_NUMBER_ANIM_MS);
}

function typeQuestionText(text, done) {
  dom.questionText.textContent = "";
  let count = 0;
  const timer = setInterval(() => {
    count += 1;
    dom.questionText.textContent = text.slice(0, count);
    if (count >= text.length) {
      clearInterval(timer);
      done();
    }
  }, TYPE_CHAR_MS);
}

function revealChoices(done) {
  const buttons = getChoiceButtons();
  buttons.forEach((button, index) => {
    setTimeout(() => {
      button.classList.remove("pre-reveal");
      button.disabled = false;
      if (index === buttons.length - 1) done();
    }, index * CHOICE_REVEAL_MS);
  });
}

function renderQuestion() {
  state.locked = true;
  setCharacter("neutral");
  const question = state.questions[state.currentIndex];
  const entries = buildShuffledChoices(question);
  state.currentChoices = entries;
  state.answerIndex = entries.findIndex((entry) => entry.correct);
  dom.questionText.textContent = "";
  buildChoiceButtons(entries);
  updatePrizeBanner();
  playQuestionNumber(() => {
    typeQuestionText(question.text, () => {
      setTimeout(() => {
        revealChoices(() => {
          state.locked = false;
          startTimer();
        });
      }, CHOICES_START_DELAY_MS);
    });
  });
}

function getChoiceButtons() {
  return Array.from(dom.choices.querySelectorAll(".choice"));
}

function tickTimer() {
  timeRemaining -= 1;
  dom.timerNum.textContent = String(Math.max(0, timeRemaining));
  if (timeRemaining <= TIMER_WARNING_SEC) dom.timer.classList.add("warning");
  if (timeRemaining <= 0) handleTimeout();
}

function startTimer() {
  if (DEBUG_MODE) return;
  timeRemaining = ANSWER_TIME_SEC;
  dom.timerNum.textContent = String(timeRemaining);
  dom.timer.classList.remove("warning");
  dom.timer.classList.add("active");
  dom.timerProgress.style.animationPlayState = "";
  dom.timerProgress.classList.remove("run");
  void dom.timerProgress.offsetWidth;
  dom.timerProgress.classList.add("run");
  timerIntervalId = setInterval(tickTimer, 1000);
}

function pauseTimer() {
  if (timerIntervalId === null) return;
  clearInterval(timerIntervalId);
  timerIntervalId = null;
  dom.timerProgress.style.animationPlayState = "paused";
}

function resumeTimer() {
  if (timerIntervalId !== null || !dom.timer.classList.contains("active") || timeRemaining <= 0) return;
  dom.timerProgress.style.animationPlayState = "running";
  timerIntervalId = setInterval(tickTimer, 1000);
}

function stopTimer() {
  if (timerIntervalId !== null) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
  dom.timer.classList.remove("active");
  dom.timerProgress.style.animationPlayState = "";
}

function handleTimeout() {
  stopTimer();
  state.locked = true;
  const buttons = getChoiceButtons();
  buttons.forEach((button) => (button.disabled = true));
  buttons[state.answerIndex].classList.add("correct");
  setCharacter("wrong");
  setTimeout(() => finishGame(false), REVEAL_HOLD_MS);
}

function onChoiceClick(selectedIndex) {
  if (state.locked) return;
  state.lastAnswerSec = Math.max(0, ANSWER_TIME_SEC - timeRemaining);
  stopTimer();
  state.locked = true;
  const buttons = getChoiceButtons();
  buttons.forEach((button) => (button.disabled = true));
  const selectedButton = buttons[selectedIndex];
  selectedButton.classList.add("selected");
  setCharacter("suspense");
  document.body.classList.add("answering", "dimmed");
  setTimeout(() => revealAnswer(selectedIndex, buttons), SELECT_FLASH_MS);
}

function revealAnswer(selectedIndex, buttons) {
  const answerIndex = state.answerIndex;
  const selectedButton = buttons[selectedIndex];
  selectedButton.classList.remove("selected");
  buttons[answerIndex].classList.add("correct");
  if (selectedIndex !== answerIndex) selectedButton.classList.add("wrong");
  const isCorrect = selectedIndex === answerIndex;
  if (isCorrect) state.totalTimeSec += state.lastAnswerSec;
  setCharacter(isCorrect ? "cheer" : "wrong");
  document.body.classList.remove("dimmed");
  setTimeout(() => document.body.classList.remove("answering"), ANSWERING_RELEASE_MS);
  setTimeout(() => advanceAfterReveal(isCorrect), REVEAL_HOLD_MS);
}

function buildLadder() {
  dom.ladderList.innerHTML = "";
  for (let index = PRIZE_AMOUNTS.length - 1; index >= 0; index -= 1) {
    const row = document.createElement("li");
    row.className = "ladder-row";
    if (SAFETY_LINE_INDICES.includes(index)) row.classList.add("safety");
    row.innerHTML = `<span class="ladder-step">${index + 1}</span><span class="ladder-amount">${formatYen(PRIZE_AMOUNTS[index])}</span>`;
    dom.ladderList.appendChild(row);
  }
}

function ladderRowAt(prizeIndex) {
  const rows = dom.ladderList.querySelectorAll(".ladder-row");
  return rows[PRIZE_AMOUNTS.length - 1 - prizeIndex];
}

function moveLadderCursor(row, animate) {
  dom.ladderCursor.style.transitionDuration = animate ? "" : "0s";
  dom.ladderCursor.style.top = `${row.offsetTop}px`;
  dom.ladderCursor.style.height = `${row.offsetHeight}px`;
}

function showLadderTransition(fromIndex, toIndex, done) {
  buildLadder();
  dom.ladderOverlay.classList.remove("hidden");
  const fromRow = ladderRowAt(fromIndex);
  const toRow = ladderRowAt(toIndex);
  moveLadderCursor(fromRow, false);
  fromRow.classList.add("is-current");
  setTimeout(() => {
    fromRow.classList.remove("is-current");
    toRow.classList.add("is-current");
    moveLadderCursor(toRow, true);
    setTimeout(() => {
      dom.ladderOverlay.classList.add("hidden");
      done();
    }, LADDER_MOVE_MS + LADDER_HOLD_AFTER_MS);
  }, LADDER_HOLD_BEFORE_MS);
}

function advanceAfterReveal(isCorrect) {
  if (!isCorrect) {
    finishGame(false);
    return;
  }
  const isFinalQuestion = state.currentIndex === state.questions.length - 1;
  if (isFinalQuestion) {
    finishGame(true);
    return;
  }
  const wonIndex = state.currentIndex;
  state.currentIndex += 1;
  showLadderTransition(wonIndex, state.currentIndex, renderQuestion);
}

function disableLifeline(button, key) {
  button.classList.add("used");
  button.disabled = true;
  state.lifelines[key] = true;
}

function useFiftyFifty() {
  if (state.lifelines.fiftyFifty || state.locked) return;
  disableLifeline(dom.fiftyFifty, "fiftyFifty");
  const buttons = getChoiceButtons();
  state.currentChoices.forEach((choice, index) => {
    if (choice.keep) return;
    buttons[index].classList.add("eliminated");
    buttons[index].disabled = true;
  });
}

function usePhone() {
  if (state.lifelines.phone || state.locked) return;
  disableLifeline(dom.phone, "phone");
  openModal("オンコール仲間に電話", `<p>「${state.questions[state.currentIndex].friendHint}」</p>`);
}

function useAudience() {
  if (state.lifelines.audience || state.locked) return;
  disableLifeline(dom.audience, "audience");
  const bars = state.currentChoices
    .map(
      (choice, index) => `
      <div class="audience-bar">
        <span class="bar-pct">${choice.audience}%</span>
        <div class="bar" style="height:${choice.audience}%"></div>
        <span class="bar-letter">${CHOICE_LABELS[index]}</span>
      </div>`
    )
    .join("");
  openModal("チームに聞く", `<div class="audience-bars">${bars}</div>`);
}

function openModal(title, bodyHtml) {
  pauseTimer();
  dom.modalTitle.textContent = title;
  dom.modalBody.innerHTML = bodyHtml;
  dom.modal.classList.remove("hidden");
}

function closeModal() {
  dom.modal.classList.add("hidden");
  resumeTimer();
}

function submitScore(name, correct, timeSec) {
  if (!RANKING_API_URL) return;
  const entry = { name, correct, time: timeSec };
  fetch(RANKING_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  }).catch(() => {});
}

function finishGame(isWinner) {
  const prize = isWinner ? PRIZE_AMOUNTS[PRIZE_AMOUNTS.length - 1] : lastClearedPrize();
  const correctCount = isWinner ? state.questions.length : state.currentIndex;
  dom.resultTitle.textContent = isWinner ? "🎉 全問正解！" : "ゲームオーバー";
  dom.resultPrize.textContent = `獲得賞金: ${prize === 0 ? "0円" : formatPrize(prize)}`;
  dom.resultScreen.classList.remove("hidden");
  submitScore(dom.playerName.textContent, correctCount, state.totalTimeSec);
}

function startGame() {
  stopTimer();
  document.body.classList.remove("answering", "dimmed");
  dom.ladderOverlay.classList.add("hidden");
  state.questions = buildQuizSet();
  state.currentIndex = 0;
  state.locked = false;
  state.totalTimeSec = 0;
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

// デバッグ用（再有効化する場合は下記ブロックを戻す）
// dom.debugButtons.addEventListener("click", (event) => {
//   const mood = event.target.dataset.mood;
//   if (mood) setCharacter(mood);
// });
