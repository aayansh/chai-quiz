# The Chai Quiz — Deployment & Setup

## Files in this folder

- `index.html` — the quiz page
- `quiz-data.js` — the 15 trivia questions; edit this to change copy
- `firebase-config.js` — **optional** cross-device leaderboard config (see below)
- `helpers.jsx`, `icons.jsx`, `use-quiz.jsx`, `tweaks-panel.jsx`, `variation-storybook.jsx` — supporting components

---

## Re-deploying to GitHub Pages

When you change any file, you just need to push the changed files back to your repo.

1. Open your repo at https://github.com/YOUR-USERNAME/chai-quiz
2. For each file you changed: click the filename → pencil icon → paste the new content → "Commit changes"
   **OR** click "Add file → Upload files" and drop the new versions in (overwrite when asked)
3. GitHub Pages re-deploys automatically in ~30 seconds. Hard-refresh the page (Ctrl+Shift+R / Cmd+Shift+R) to bust the cache.

⚠️ **Your existing scores are safe** — the localStorage key didn't change. Scores on your Chromebook stay on the Chromebook (until you turn on Firebase, below).

---

## 🔒 Admin mode (for teachers)

- Press **Ctrl+Shift+T** anywhere in the quiz to open the admin panel
- Default password: **`chai`** (change it once you're in!)
- What you can do:
  - **View all scores** in one place (live updates if Firebase is on)
  - **✎ Edit any player's time** — set a cheater to 999 seconds so they drop down the ranking
  - **🗑 Delete a player's row** — if they cheated more than once
  - **Change the admin password**

The leaderboard kids see has no delete or reset buttons — those are admin-only.

---

## ☁️ Cross-device leaderboard (optional, ~5 min setup)

By default, scores save **per device** in the browser. To make every classroom laptop see one shared live leaderboard, set up Firebase Realtime Database. **Free, no credit card.**

### Step-by-step

1. Go to **https://console.firebase.google.com** → sign in with your Google account.
2. Click **"Add project"** → name it `chai-quiz` → disable Google Analytics → **Create project**.
3. On the project home, click the **`</>`** (Web) icon → name the app `chai-quiz` → **Register app**. Skip hosting.
4. Firebase shows you a `firebaseConfig` object. **Copy it.** (You can find it again later under Project Settings → "Your apps".)
5. In the left sidebar: **Build → Realtime Database → Create database** → pick a region (any) → start in **test mode** → **Enable**.
   - ⚠️ Test mode = anyone with the URL can read/write for 30 days. Plenty for a school project. After 30 days you can extend it in **Rules** tab.
6. **Find your `databaseURL`**: top of the Realtime Database page, looks like `https://chai-quiz-default-rtdb.firebaseio.com/`. Copy it.
7. Open `firebase-config.js` and replace the bottom line:
   ```js
   window.FIREBASE_CONFIG = null;
   ```
   with your real config, including `databaseURL`:
   ```js
   window.FIREBASE_CONFIG = {
     apiKey: "AIza...",
     authDomain: "chai-quiz.firebaseapp.com",
     databaseURL: "https://chai-quiz-default-rtdb.firebaseio.com",
     projectId: "chai-quiz",
     storageBucket: "chai-quiz.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef1234567890"
   };
   ```
8. Re-upload **just `firebase-config.js`** to your GitHub repo.
9. Open your site. The admin panel will now say **"☁️ Cloud mode on"**, and the kid-facing leaderboard footer will say **"live across all devices ☁️"**. Done!

### Want to move your existing Chromebook scores to the cloud?

Once Firebase is on, only NEW plays go to the cloud automatically. To migrate old scores:
- On the Chromebook, open the quiz, press **Ctrl+Shift+T**, log in.
- You'll see the old scores listed there. They're not in the cloud yet.
- Easiest path: have kids take the quiz again (you can also just transcribe them — just have anyone with the password play the quiz from any device under each kid's name and class with the right score; or ask Claude to add an "import from localStorage" button next time).

---

## Hosting from scratch

If you're setting this up for the first time on a new host:

### GitHub Pages (recommended — you already have an account)

1. New repo at https://github.com/new — name `chai-quiz`, public, with README.
2. Add file → Upload files → drop all the files from this `deploy` folder in.
3. Settings → Pages → Source: **Deploy from a branch** → Branch: **main**, folder: **/(root)** → Save.
4. Your URL: `https://YOUR-USERNAME.github.io/chai-quiz`

### Netlify Drop (fastest, no account)

1. Go to https://app.netlify.com/drop
2. Drag this whole `deploy` folder onto the page
3. ~30 seconds → public URL

### Cloudflare Pages (cleanest URL)

1. Sign up at https://dash.cloudflare.com/sign-up (free)
2. Workers & Pages → Create → Pages → Upload assets
3. Name it `chai-quiz`, drop the folder
4. URL: `chai-quiz.pages.dev`
