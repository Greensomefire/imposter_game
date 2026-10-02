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

  var QUESTIONS = window.ODD_QUESTIONS || [];

  var state = {
    count: 4,
    names: [],          // custom names typed in setup (may be blank)
    players: [],        // resolved names for the current game
    mode: "aloud",      // "aloud" | "typed"
    pair: null,
    oddIndex: -1,
    turn: 0,            // whose turn it is while showing questions / voting
    answers: [],
    votes: []           // votes[voter] = index voted for
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

  function renderNameInputs() {
    var list = $("name-list");
    // Keep whatever has been typed so far before re-rendering.
    list.querySelectorAll("input").forEach(function (input, i) {
      state.names[i] = input.value;
    });
    clear(list);

    for (var i = 0; i < state.count; i++) {
      var dot = span(String(i + 1), "dot");
      dot.style.background = DOT_COLORS[i % DOT_COLORS.length];
      dot.setAttribute("aria-hidden", "true");

      var input = document.createElement("input");
      input.type = "text";
      input.maxLength = 20;
      input.autocomplete = "off";
      input.placeholder = "Player " + (i + 1);
      input.setAttribute("aria-label", "Name of player " + (i + 1));
      input.value = state.names[i] || "";

      list.appendChild(li([dot, input]));
    }

    $("count-value").textContent = state.count;
    $("count-minus").disabled = state.count <= MIN_PLAYERS;
    $("count-plus").disabled = state.count >= MAX_PLAYERS;
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

  function readMode() {
    var checked = document.querySelector('input[name="answer-mode"]:checked');
    return checked ? checked.value : "aloud";
  }

  /* --- Round flow ------------------------------------------------------- */

  function startRound() {
    state.pair = drawPair();
    state.oddIndex = randomInt(state.players.length);
    state.turn = 0;
    state.answers = state.players.map(function () { return ""; });
    state.votes = [];
    showPass();
  }

  function showPass() {
    var name = state.players[state.turn];
    $("pass-step").textContent = "Player " + (state.turn + 1) + " of " + state.players.length;
    $("pass-name").textContent = name;
    $("reveal-btn").textContent = "I'm " + name + " — show my question";
    showScreen("screen-pass");
  }

  function revealQuestion() {
    var isOdd = state.turn === state.oddIndex;
    $("question-name").textContent = state.players[state.turn];
    $("question-text").textContent = isOdd ? state.pair.odd : state.pair.main;

    var typed = state.mode === "typed";
    $("answer-field").hidden = !typed;
    $("answer-input").value = "";
    $("hide-btn").textContent = typed ? "Save answer & hide" : "Hide my question";
    showScreen("screen-question");
    if (typed) $("answer-input").focus();
  }

  function hideQuestion() {
    if (state.mode === "typed") {
      var answer = $("answer-input").value.trim();
      if (!answer) {
        $("answer-input").focus();
        $("answer-input").setAttribute("aria-invalid", "true");
        return;
      }
      $("answer-input").removeAttribute("aria-invalid");
      state.answers[state.turn] = answer;
    }

    // Wipe the secret from the page before handing the phone on.
    $("question-text").textContent = "";
    $("answer-input").value = "";

    state.turn++;
    if (state.turn < state.players.length) showPass();
    else showAnswers();
  }

  function fillAnswerList(list) {
    clear(list);
    state.players.forEach(function (name, i) {
      list.appendChild(li([span(name, "who"), span(state.answers[i], "what")]));
    });
  }

  function showAnswers() {
    var typed = state.mode === "typed";
    $("answers-aloud").hidden = typed;
    $("answers-typed").hidden = !typed;

    if (typed) {
      fillAnswerList($("answer-list"));
    } else {
      // Start from a random player so the odd one isn't predictable by position.
      var start = randomInt(state.players.length);
      var orderList = $("order-list");
      clear(orderList);
      for (var i = 0; i < state.players.length; i++) {
        orderList.appendChild(li([state.players[(start + i) % state.players.length]]));
      }
    }
    showScreen("screen-answers");
  }

  function showMainQuestion() {
    $("main-question").textContent = state.pair.main;
    var list = $("main-answer-list");
    list.hidden = state.mode !== "typed";
    if (state.mode === "typed") fillAnswerList(list);
    showScreen("screen-main");
  }

  /* --- Voting ----------------------------------------------------------- */

  function startVoting() {
    state.turn = 0;
    state.votes = [];
    showVotePass();
  }

  function showVotePass() {
    var name = state.players[state.turn];
    $("vote-step").textContent = "Vote " + (state.turn + 1) + " of " + state.players.length;
    $("vote-pass-name").textContent = name;
    $("vote-ready-btn").textContent = "I'm " + name + " — let me vote";
    showScreen("screen-vote-pass");
  }

  function showVote() {
    var voter = state.turn;
    $("voter-name").textContent = state.players[voter];
    var grid = $("vote-grid");
    clear(grid);
    state.players.forEach(function (name, i) {
      if (i === voter) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn";
      btn.textContent = name;
      btn.addEventListener("click", function () { castVote(i); });
      grid.appendChild(btn);
    });
    showScreen("screen-vote");
  }

  function castVote(target) {
    state.votes[state.turn] = target;
    clear($("vote-grid"));
    state.turn++;
    if (state.turn < state.players.length) showVotePass();
    else showReveal();
  }

  /* --- Reveal ----------------------------------------------------------- */

  function showReveal() {
    var counts = state.players.map(function () { return 0; });
    state.votes.forEach(function (target) { counts[target]++; });

    var top = Math.max.apply(null, counts);
    var leaders = counts.reduce(function (acc, c, i) {
      if (c === top) acc.push(i);
      return acc;
    }, []);

    var caught = leaders.length === 1 && leaders[0] === state.oddIndex;
    var tied = leaders.length > 1 && leaders.indexOf(state.oddIndex) !== -1;

    $("reveal-emoji").textContent = caught ? "🎉" : "😈";
    $("reveal-heading").textContent = caught
      ? "You found them!"
      : tied
        ? "A tie — the odd one out slipped away!"
        : "Wrong! The odd one out fooled you.";
    $("reveal-odd-name").textContent = state.players[state.oddIndex];
    $("reveal-odd-question").textContent = state.pair.odd;
    $("reveal-main-question").textContent = state.pair.main;

    var tally = $("tally");
    clear(tally);
    state.players
      .map(function (name, i) { return { name: name, count: counts[i], index: i }; })
      .sort(function (a, b) { return b.count - a.count || a.index - b.index; })
      .forEach(function (row) {
        var label = row.index === state.oddIndex ? row.name + " 🕵️" : row.name;
        var votes = row.count + (row.count === 1 ? " vote" : " votes");
        tally.appendChild(
          li([span(label, "who"), span(votes, "count")], row.index === state.oddIndex ? "is-odd" : "")
        );
      });

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
      state.mode = readMode();
      startRound();
    });

    $("reveal-btn").addEventListener("click", revealQuestion);
    $("hide-btn").addEventListener("click", hideQuestion);
    $("answer-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") hideQuestion();
    });
    $("show-main-btn").addEventListener("click", showMainQuestion);
    $("start-vote-btn").addEventListener("click", startVoting);
    $("vote-ready-btn").addEventListener("click", showVote);
    $("again-btn").addEventListener("click", startRound);
    $("change-btn").addEventListener("click", function () {
      renderNameInputs();
      showScreen("screen-setup");
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
