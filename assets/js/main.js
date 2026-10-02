/*
 * Shared behaviour for every page.
 * - Renders the game grid on the home page (if #game-grid exists).
 * - Fills in the footer year.
 */
(function () {
  "use strict";

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "text") node.textContent = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    (children || []).forEach(function (child) { node.appendChild(child); });
    return node;
  }

  function renderGameGrid() {
    var grid = document.getElementById("game-grid");
    if (!grid || !Array.isArray(window.GAMES)) return;

    window.GAMES.forEach(function (game) {
      var card = el("article", { class: "card game-card" }, [
        el("div", { class: "emoji", "aria-hidden": "true", text: game.emoji || "🎲" }),
        el("h2", { text: game.title }),
        el("p", { class: "meta", text: game.players || "" }),
        el("p", { text: game.description }),
        el("a", { class: "btn btn-block", href: game.path, text: "Play " + game.title })
      ]);
      grid.appendChild(el("li", {}, [card]));
    });

    grid.appendChild(
      el("li", {}, [
        el("div", { class: "card game-card coming-soon", text: "More games coming soon…" })
      ])
    );
  }

  function setYear() {
    document.querySelectorAll("[data-year]").forEach(function (node) {
      node.textContent = new Date().getFullYear();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderGameGrid();
    setYear();
  });
})();
