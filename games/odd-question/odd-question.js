/*
 * Odd Question: pass-the-phone game logic.
 * Depends on window.ODD_QUESTIONS from questions.js.
 */
(function () {
  "use strict";

  var MIN_PLAYERS = 3;
  var MAX_PLAYERS = 12;
  var DECK_KEY = "odd-question:deck";
  var DOT_COLORS = ["#ff4f8b", "#3a86ff", "#2ec4b6", "#ff9f1c", "#8338ec", "#ffd23f"];
  var EMOJIS = [
    "🐶", "🐱", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐸", "🐵", "🐧", "🐙",
    "🦄", "🐲", "🦖", "🐢", "🦉", "🐝", "🦋", "🐳", "🦀", "🐷", "🐰", "🦔",
    "👽", "🤖", "👻", "🤠", "🥷", "🧙", "🧛", "🧜", "🍕", "🌮", "🍩", "🍉",
    "🌵", "🌻", "🍄", "⚡", "🔥", "🌈", "⭐", "🎸", "🚀", "🎩", "👑", "💎"
  ];

  var QUESTIONS = window.ODD_QUESTIONS || [];

  var state = {
    count: 4,
    names: [],          // custom names typed in setup (may be blank)
    avatars: [],        // emoji picture for each player slot
    players: [],        // resolved names for the current game
    pair: null,
    oddIndex: -1,
    turn: 0,            // the player currently looking at their question
    answers: []         // "" until that player has answered
  };

  function $(id) { return document.getElementById(id); }

  /* --- Helpers ---------------------------------------------------------- */

  function randomInt(max) {
    if (window.crypto && window.crypto.getRandomValues) {
      var buf = new Uint32Array(1);
      window.crypto.getRandomValues(buf);
      return buf[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = randomInt(i + 1);
      var tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function li(children, className) {
    var item = document.createElement("li");
    if (className) item.className = className;
    children.forEach(function (child) {
      if (typeof child === "string") item.appendChild(document.createTextNode(child));
      else item.appendChild(child);
    });
    return item;
  }

  function span(text, className) {
    var s = document.createElement("span");
    s.className = className;
    s.textContent = text;
    return s;
  }

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach(function (screen) {
      screen.hidden = screen.id !== id;
    });
    // Lets CSS hide the page chrome on the private question screen.
    document.body.setAttribute("data-screen", id);
    window.scrollTo(0, 0);
    var target = $(id);
    var focusable = target.querySelector("h2, .question-text, .step");
    if (focusable) {
      focusable.setAttribute("tabindex", "-1");
      focusable.focus({ preventScroll: true });
    }
  }

  /* --- Question deck (no repeats until all are used) ------------------- */

  function loadDeck() {
    try {
      var saved = JSON.parse(sessionStorage.getItem(DECK_KEY));
      if (Array.isArray(saved) && saved.every(function (i) { return i >= 0 && i < QUESTIONS.length; })) {
        return saved;
      }
    } catch (e) { /* storage unavailable: fall through */ }
    return null;
  }

  function saveDeck(deck) {
    try { sessionStorage.setItem(DECK_KEY, JSON.stringify(deck)); } catch (e) { /* ignore */ }
  }

  var deck = loadDeck() || [];

  function drawPair() {
    if (deck.length === 0) {
      deck = shuffle(QUESTIONS.map(function (_, i) { return i; }));
    }
    var index = deck.pop();
    saveDeck(deck);
    return QUESTIONS[index];
  }

  /* --- Setup ------------------------------------------------------------ */

  // A random emoji that no other player (except `slot` itself) is using.
  function randomAvatar(slot) {
    var taken = state.avatars.filter(function (_, i) { return i !== slot && i < state.count; });
    var free = EMOJIS.filter(function (e) { return taken.indexOf(e) === -1 && e !== state.avatars[slot]; });
    return free[randomInt(free.length)];
  }

  function label(player) {
    return state.avatars[player] + " " + state.players[player];
  }

  function renderNameInputs() {
    var list = $("name-list");
    // Keep whatever has been typed so far before re-rendering.
    list.querySelectorAll("input").forEach(function (input, i) {
      state.names[i] = input.value;
    });
    clear(list);

    for (var i = 0; i < state.count; i++) {
      if (!state.avatars[i] || state.avatars.slice(0, i).indexOf(state.avatars[i]) !== -1) {
        state.avatars[i] = randomAvatar(i);
      }
      var avatar = document.createElement("button");
      avatar.type = "button";
      avatar.className = "avatar";
      avatar.textContent = state.avatars[i];
      avatar.style.background = DOT_COLORS[i % DOT_COLORS.length];
      avatar.setAttribute("aria-label", "Change picture for player " + (i + 1));
      avatar.addEventListener("click", changeAvatar.bind(null, i, avatar));

      var input = document.createElement("input");
      input.type = "text";
      input.maxLength = 20;
      input.autocomplete = "off";
      input.placeholder = "Player " + (i + 1);
      input.setAttribute("aria-label", "Name of player " + (i + 1));
      input.value = state.names[i] || "";

      list.appendChild(li([avatar, input]));
    }

    $("count-value").textContent = state.count;
    $("count-minus").disabled = state.count <= MIN_PLAYERS;
    $("count-plus").disabled = state.count >= MAX_PLAYERS;
  }

  function changeAvatar(slot, button) {
    state.avatars[slot] = randomAvatar(slot);
    button.textContent = state.avatars[slot];
    button.classList.remove("spin");
    void button.offsetWidth; // restart the animation
    button.classList.add("spin");
  }

  function changeCount(delta) {
    var next = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, state.count + delta));
    if (next === state.count) return;
    state.count = next;
    renderNameInputs();
  }

  function readPlayers() {
    var inputs = $("name-list").querySelectorAll("input");
    var used = {};
    var players = [];
    inputs.forEach(function (input, i) {
      state.names[i] = input.value;
      var name = input.value.trim() || "Player " + (i + 1);
      // Make duplicate names distinguishable.
      var base = name;
      var n = 2;
      while (used[name.toLowerCase()]) name = base + " (" + n++ + ")";
      used[name.toLowerCase()] = true;
      players.push(name);
    });
    return players;
  }

  /* --- Round flow ------------------------------------------------------- */

  function startRound() {
    state.pair = drawPair();
    state.oddIndex = randomInt(state.players.length);
    state.answers = state.players.map(function () { return ""; });
    showPick();
  }

  function showPick() {
    var done = state.answers.filter(Boolean).length;
    $("pick-step").textContent = done + " of " + state.players.length + " answered";
    var grid = $("pick-grid");
    clear(grid);
    state.players.forEach(function (name, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn";
      if (state.answers[i]) {
        btn.className += " is-done";
        btn.disabled = true;
        btn.textContent = "✓ " + label(i);
        btn.setAttribute("aria-label", name + ", already answered");
      } else {
        btn.textContent = label(i);
        btn.addEventListener("click", function () { showPass(i); });
      }
      grid.appendChild(btn);
    });
    showScreen("screen-pick");
  }

  function showPass(player) {
    state.turn = player;
    $("pass-avatar").textContent = state.avatars[player];
    $("pass-name").textContent = state.players[player];
    showScreen("screen-pass");
  }

  function revealQuestion() {
    var isOdd = state.turn === state.oddIndex;
    $("question-name").textContent = label(state.turn);
    $("question-text").textContent = isOdd ? state.pair.odd : state.pair.main;
    $("answer-input").value = "";
    showScreen("screen-question");
    $("answer-input").focus();
  }

  function hideQuestion() {
    var answer = $("answer-input").value.trim();
    if (!answer) {
      $("answer-input").focus();
      $("answer-input").setAttribute("aria-invalid", "true");
      return;
    }
    $("answer-input").removeAttribute("aria-invalid");
    state.answers[state.turn] = answer;

    // Wipe the secret from the page before handing the phone on.
    $("question-text").textContent = "";
    $("answer-input").value = "";

    if (state.answers.every(Boolean)) showMainQuestion();
    else showPick();
  }

  function fillAnswerList(list) {
    clear(list);
    state.players.forEach(function (name, i) {
      list.appendChild(li([span(label(i), "who"), span(state.answers[i], "what")]));
    });
  }

  function showMainQuestion() {
    $("main-question").textContent = state.pair.main;
    fillAnswerList($("main-answer-list"));
    showScreen("screen-main");
  }

  /* --- Reveal ----------------------------------------------------------- */

  function showReveal() {
    $("reveal-avatar").textContent = state.avatars[state.oddIndex];
    $("reveal-odd-name").textContent = state.players[state.oddIndex];
    $("reveal-odd-answer").textContent = state.answers[state.oddIndex];
    $("reveal-odd-question").textContent = state.pair.odd;
    $("reveal-main-question").textContent = state.pair.main;
    showScreen("screen-reveal");
  }

  /* --- Wiring ----------------------------------------------------------- */

  function init() {
    if (!$("screen-setup")) return;

    renderNameInputs();

    $("count-minus").addEventListener("click", function () { changeCount(-1); });
    $("count-plus").addEventListener("click", function () { changeCount(1); });

    $("start-btn").addEventListener("click", function () {
      if (QUESTIONS.length === 0) return;
      state.players = readPlayers();
      startRound();
    });

    $("reveal-btn").addEventListener("click", revealQuestion);
    $("pick-back-btn").addEventListener("click", showPick);
    $("hide-btn").addEventListener("click", hideQuestion);
    $("answer-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") hideQuestion();
    });
    $("show-odd-btn").addEventListener("click", showReveal);
    $("again-btn").addEventListener("click", startRound);
    $("change-btn").addEventListener("click", function () {
      renderNameInputs();
      showScreen("screen-setup");
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
