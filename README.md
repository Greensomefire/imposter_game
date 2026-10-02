# Party Games

A small static website with pass-the-phone party games. It is plain HTML, CSS and JavaScript with no framework, no build step and no server code. It runs on GitHub Pages and also works when you open `index.html` straight from disk.

## Games

| Game | Players | Description |
| --- | --- | --- |
| [Odd Question](games/odd-question/index.html) | 3–12 | Everyone answers the same question except one secret player. Find the odd one out. |

## Folder structure

```
/
├── index.html                  Home page (grid of game cards)
├── README.md
├── .nojekyll                   Tells GitHub Pages to serve files as they are
├── assets/
│   ├── css/
│   │   ├── main.css            Shared styles: colours, layout, typography, buttons, cards
│   │   └── home.css            Home page only
│   ├── js/
│   │   ├── main.js             Shared behaviour: builds the home grid, footer year
│   │   └── games.js            The list of games shown on the home page
│   └── images/
│       └── logo.svg            Logo and favicon
└── games/
    └── odd-question/
        ├── index.html          Game page
        ├── odd-question.css    Styles for this game only
        ├── odd-question.js     Game logic
        └── questions.js        Question pairs (200 of them)
```

Rules the site follows:

- **Relative paths only.** Pages link with paths like `../../assets/css/main.css`, never `/assets/...`. A path that starts with `/` breaks on a GitHub Pages project site, which is served from `https://username.github.io/repo-name/`.
- **Links name `index.html` explicitly**, for example `games/odd-question/index.html`. That way they also work over `file://`, where a link to a folder shows a directory listing instead of the page.
- **Lowercase, hyphenated names** for every file and folder. GitHub Pages is case sensitive.
- **Data lives in `.js` files** loaded with `<script>`, for example `window.ODD_QUESTIONS = [...]`. Browsers block `fetch()` of `.json` files opened from disk, so JSON files would break the offline case.

## Run it locally

Either of these works:

1. **Open the file directly:** double-click `index.html`.
2. **Use a local web server.** This is closer to how GitHub Pages serves the site. From the repository root:

   ```sh
   python3 -m http.server 8000
   ```

   Then open <http://localhost:8000/>.

The font (Inter) comes from Google Fonts. When you're offline, the site falls back to system fonts.

## Add a new game

1. **Create a folder** under `games/` with a lowercase, hyphenated name, for example `games/word-chain/`.
2. **Add the page and its files** to that folder: `index.html`, `word-chain.css` and `word-chain.js`, plus any data `.js` files.
3. **Reuse the shared header.** The easiest way is to copy `games/odd-question/index.html` and replace the contents of `<main>`. Keep these parts as they are:

   ```html
   <link rel="stylesheet" href="../../assets/css/main.css">
   <link rel="stylesheet" href="word-chain.css">
   ...
   <header class="site-header">
     <div class="container">
       <a class="brand" href="../../index.html" aria-label="Party Games home">
         <img src="../../assets/images/logo.svg" alt="" width="40" height="40">
         <span class="brand-text-optional">Party Games</span>
       </a>
       <a class="back-link" href="../../index.html">&larr; Back to home</a>
     </div>
   </header>
   ...
   <script src="../../assets/js/main.js"></script>
   <script src="word-chain.js"></script>
   ```

4. **Register the game** by adding one entry to `assets/js/games.js`:

   ```js
   {
     slug: "word-chain",
     title: "Word Chain",
     emoji: "🔗",
     players: "2–8 players",
     description: "One short sentence about the game.",
     path: "games/word-chain/index.html"
   }
   ```

   The home page builds its card from this entry.

You can use the shared components in `main.css` in any game: `.card`, `.btn` (the primary action), `.btn-secondary` and `.btn-block`. All colours are CSS variables at the top of `main.css`; reference those rather than writing colour values in a game's stylesheet. See `CLAUDE.md` for the visual style rules.

### Add Odd Question pairs

Add objects to `games/odd-question/questions.js`:

```js
{ main: "Question most players get", odd: "Similar question for the odd one out" }
```

Both questions in a pair should have the same kind of answer (a number, a food, a place, and so on). That keeps the odd answer believable.

## Publish on GitHub Pages

1. **Create a repository** on GitHub, for example `party-games`.
2. **Push this folder** to the `main` branch:

   ```sh
   git branch -M main          # rename the local branch to main if needed
   git remote add origin https://github.com/<username>/party-games.git   # skip if a remote is already set
   git add .
   git commit -m "Party games site"
   git push -u origin main
   ```

3. **Turn on Pages.** On GitHub, open the repository and go to **Settings → Pages**.
4. **Set the source.** Under **Build and deployment**, set:
   - **Source:** *Deploy from a branch*
   - **Branch:** `main`, folder **`/ (root)`**, then click **Save**.
5. **Check the deployment.** After a minute or two, the site is live at `https://<username>.github.io/party-games/`. The **Actions** tab shows each deployment's progress, and the Pages settings page shows the URL.

Every later push to `main` redeploys the site automatically.
