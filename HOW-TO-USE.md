# 🍵 The Chai Quiz — How to Use It

Everything you need, in plain steps. Keep this file with the others.

---

## ⭐ The 3 secret passwords (don't tell the kids!)

| What | How to open | Password |
|------|-------------|----------|
| **Teacher panel** | Press **Ctrl + Shift + T** | `chai` |
| **Master "All-Might" room** | Type the word **`kettle`** anywhere | `godchai` |

> Change both passwords once you're in (there's a "change password" box in each). Then write your new ones at the bottom of this page.

---

## 1) Put it online (so the class can play)

You already did this on GitHub Pages. To **update** it after any change:

1. Go to your repo: **https://github.com/aayansh/chai-quiz**
2. Click **Add file → Upload files**
3. Drag in the changed files (I'll always tell you which ones)
4. Scroll down → **Commit changes**
5. Wait ~30 seconds, then on the live site press **Ctrl + Shift + R** to refresh

Your game link: **https://aayansh.github.io/chai-quiz**

---

## 2) Turn on the shared leaderboard (one time, ~5 min)

This makes **every laptop show the same scores**. Without it, each laptop only sees its own.

1. Go to **https://console.firebase.google.com**
2. You already made the **chai-quiz** project — open it.
3. Make sure **Build → Realtime Database** exists and is in **test mode**.
4. Open the file **`firebase-config.js`** and check your details are filled in (apiKey, databaseURL, etc.).
5. If you ever see **"☁️ Cloud mode on"** in a panel, it's working. 🎉

> Already set up? Then you're done — nothing to do here.

---

## 3) Running the quiz in class

1. Each kid opens the game link on their laptop.
2. They tap **Play**, type their **name + class** (6M or 6BC), and start.
3. Scores climb the **Class Leaderboard** as they finish levels.
4. Project the **Leaderboard** on the big screen for everyone to see.

**One laptop = one player.** Once a kid signs in, that laptop is theirs — nobody else can sign in on it (stops cheating). To free a laptop, see the Master room below.

---

## 4) 🔒 Teacher panel (Ctrl + Shift + T → `chai`)

Use this for everyday classroom control:

- **See all players** and their stars/time.
- **✎ Edit** a player's stars or time — fix a cheater (e.g. change 9 seconds to 999).
- **👏 Praise** — send a kid a "Good job!" message.
- **💻 Free their laptop** — let one student sign in fresh.
- **🗑 Delete** a player, or **Clear all** to reset between classes.

---

## 5) ⚡ Master "All-Might" room (type `kettle` → `godchai`)

Your secret super-panel. It has **everything the teacher panel has, PLUS:**

- **🛑 Stop Everyone** — freezes EVERY screen at once with a "Pencils down!" message. Tap again to resume. (Great for getting attention.)
- **🎵 Music** — turn music on for the whole class:
  1. Toggle **Background music** ON.
  2. Paste a **direct audio link** in the **Music link** box (a link that ends in `.mp3`, `.ogg`, or `.m4a`).
  3. Tap **Play for everyone**.
  - Every kid then gets a **🎵 / 🔇** button to mute on their own laptop.
  - ⚠️ Use only music you're allowed to (your own file or royalty-free). Copyrighted songs (Minecraft "Lava Chicken", in-game music, Grizzy & the Lemmings, etc.) **can't** be added — but a legal direct link will play.
- **💻 Reset ALL laptops** — frees every laptop in one tap (for handing devices to the next group). Scores are kept.

---

## 6) Changing the questions

Open **`quiz-data.js`**. Each question looks like this:

```js
{
  q: 'What does the word "chai" mean?',
  options: [
    { label: 'Milk' },
    { label: 'Tea', correct: true },   // <- the right answer
    { label: 'Sugar' },
    { label: 'Spice' },
  ],
  fact: 'Chai literally means tea!',   // shown after they answer
}
```

- Change the words, keep `correct: true` on the right answer.
- The game **shuffles** question order and answer positions automatically, so it's never "always B".
- Save, upload `quiz-data.js` to GitHub (step 1), refresh.

---

## 7) Common things you'll want to do

| I want to… | Do this |
|------------|---------|
| Reset scores for a new class | Teacher panel → **Clear all** |
| Stop a cheater's fast time | Teacher panel → **✎** → set time to 999 |
| Get everyone's attention | Master room → **🛑 Stop Everyone** |
| Play music | Master room → **🎵** → paste a legal link → Play |
| Hand laptops to the next group | Master room → **⚡ Reset ALL laptops** |
| Let one kid restart | Teacher panel → **💻** next to their name |
| Remove yourself from the board | Leaderboard → **🗑 Remove me** (kids can do this) |

---

## My passwords (write them here once you change them)

- Teacher panel: ____________________
- Master room: ____________________

---

*Made with 🍵 for your class quiz. Have fun!*
