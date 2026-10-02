/*
 * The list of games shown on the home page.
 * To add a game: create games/<slug>/index.html and add one entry here.
 * "path" is relative to the site root and must match the folder name exactly.
 */
window.GAMES = [
  {
    slug: "odd-question",
    title: "Odd Question",
    emoji: "🕵️",
    players: "3–12 players",
    description:
      "Everyone answers the same question… except one player, who secretly got a different one. Can you spot the odd one out?",
    path: "games/odd-question/index.html"
  }
];
