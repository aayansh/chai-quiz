# The Chai Quiz — Deployment

Three easy free hosts. Pick whichever you prefer — all give you a public URL students can open in their browser.

## Option 1 · Netlify Drop (no account needed to try)

1. Go to **https://app.netlify.com/drop**
2. Drag the **whole `deploy` folder** (not the zip) onto the page
3. Wait ~30 seconds → you get a URL like `chai-quiz-abc123.netlify.app`
4. Share that URL with your class
5. To keep the same URL between updates, click "Claim this site" and sign up (free)

## Option 2 · Cloudflare Pages (cleaner URL, free account)

1. Sign up at **https://dash.cloudflare.com/sign-up** (free, no credit card)
2. Go to **Workers & Pages → Create → Pages → Upload assets**
3. Name the project (e.g. `chai-quiz`) — your URL becomes `chai-quiz.pages.dev`
4. Drag the **whole `deploy` folder** onto the upload area
5. Click **Deploy site** → URL is live in ~20 seconds

## Option 3 · GitHub Pages (URL has your username — portfolio friendly)

1. Go to **https://github.com/new**
2. Repo name: `chai-quiz` · Public · ☑ Add a README · click **Create repository**
3. On the new repo page, click **Add file → Upload files**
4. Open this `deploy` folder on your computer, select all files inside
   (`index.html`, `quiz-data.js`, all the `.jsx` files, `README.md`),
   and drag them into the upload area on GitHub.
   ⚠️ Upload the *contents* of the folder, not the folder itself.
5. Scroll down → **Commit changes**
6. Go to **Settings** (top tab) → **Pages** (left sidebar)
7. Under "Build and deployment":
   - Source: **Deploy from a branch**
   - Branch: **main** · folder: **/(root)** → click **Save**
8. Wait ~1 minute. URL becomes **https://YOUR-USERNAME.github.io/chai-quiz**

To update later: open the repo → Add file → Upload files → drop the changed file(s) → Commit. The site refreshes in ~30 seconds.

## Files in this folder

- `index.html` — the quiz (the host serves this by default)
- `quiz-data.js` — the 15 questions; edit this to change copy
- `helpers.jsx`, `icons.jsx`, `use-quiz.jsx`, `tweaks-panel.jsx`, `variation-storybook.jsx` — supporting components

## About the leaderboard

Scores save to the browser's local storage on the device that's playing. That means:

- **One shared laptop passed around the class** → everyone's scores show on the same leaderboard ✅
- **Each kid on their own device** → each device only sees its own scores 🚧

If you want a real cross-device leaderboard later, ask Claude to wire it up with Firebase or Supabase.

## Re-uploading later

If you edit anything (e.g. change `quiz-data.js`), just drag the folder onto the same host again. All three keep the same URL if you've signed in.
