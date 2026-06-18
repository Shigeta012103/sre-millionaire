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
const YEN_UNIT = 10000;
const BASE_AUDIENCE_BIAS = 70;
const BIAS_DECAY_PER_QUESTION = 2.5;
const MIN_CORRECT_BIAS = 35;

const DEFAULT_PLAYER_NAME = "挑戦者";

const dom = {
  questionText: document.getElementById("question-text"),
  questionNumber: document.getElementById("question-number"),
  questionNumberText: document.getElementById("question-number-text"),
  choices: document.getElementById("choices"),
  timer: document.getElementById("timer"),
  timerNum: document.getElementById("timer-num"),
  timerProgress: document.getElementById("timer-progress"),
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
  currentIndex: 0,
  answerIndex: 0,
  locked: false,
  lifelines: { fiftyFifty: false, phone: false, audience: false },
};

let timerIntervalId = null;

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

function buildShuffledChoices(question) {
  const entries = question.choices.map((text, index) => ({
    text,
    isCorrect: index === question.answerIndex,
  }));
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
  const question = QUIZ_QUESTIONS[state.currentIndex];
  const entries = buildShuffledChoices(question);
  state.answerIndex = entries.findIndex((entry) => entry.isCorrect);
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

function startTimer() {
  if (DEBUG_MODE) return;
  let remaining = ANSWER_TIME_SEC;
  dom.timerNum.textContent = String(remaining);
  dom.timer.classList.remove("warning");
  dom.timer.classList.add("active");
  dom.timerProgress.classList.remove("run");
  void dom.timerProgress.offsetWidth;
  dom.timerProgress.classList.add("run");
  timerIntervalId = setInterval(() => {
    remaining -= 1;
    dom.timerNum.textContent = String(Math.max(0, remaining));
    if (remaining <= TIMER_WARNING_SEC) dom.timer.classList.add("warning");
    if (remaining <= 0) handleTimeout();
  }, 1000);
}

function stopTimer() {
  if (timerIntervalId !== null) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
  dom.timer.classList.remove("active");
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
  setCharacter(isCorrect ? "cheer" : "wrong");
  document.body.classList.remove("dimmed");
  setTimeout(() => document.body.classList.remove("answering"), ANSWERING_RELEASE_MS);
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
  const answerIndex = state.answerIndex;
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
  const answerIndex = state.answerIndex;
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
  stopTimer();
  document.body.classList.remove("answering", "dimmed");
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

// デバッグ用（再有効化する場合は下記ブロックを戻す）
// dom.debugButtons.addEventListener("click", (event) => {
//   const mood = event.target.dataset.mood;
//   if (mood) setCharacter(mood);
// });
