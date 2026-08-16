# 🐍 Snake Game

A modern, responsive take on the classic Snake game — built with vanilla HTML, CSS, and JavaScript. Features multiple themes, mobile touch controls, levels with obstacles, and persistent high scores.

**🎮 Live Demo:** [rohit73848.github.io/snake-game](https://rohit73848.github.io/snake-game/)
**📦 Repository:** [github.com/rohit73848/snake-game](https://github.com/rohit73848/snake-game)

---

## ✨ Features

- **Classic Snake gameplay** with smooth grid-based movement
- **Three themes** — Cyberpunk, Retro, and Light — switchable on the fly and saved to `localStorage`
- **Levels & obstacles** — every 50 points levels you up, spawns new obstacles, and increases speed
- **High score tracking** — persisted locally across sessions
- **Live timer** showing minutes and seconds elapsed
- **Pause / Resume** — via spacebar, on-screen button, or swipe
- **Fully responsive** — adapts grid, layout, and controls across desktop, tablet, and mobile
- **Mobile-first controls:**
  - On-screen D-pad
  - Swipe gestures
  - Haptic feedback (vibration) on key events
  - Landscape-mode rotation prompt
- **Auto-pause** when the tab loses focus or the app is backgrounded
- **Safe spawning** — food and obstacles never spawn on top of the snake or each other

## 🕹️ Controls

| Action | Desktop | Mobile |
|---|---|---|
| Move | Arrow keys | D-pad buttons or swipe |
| Pause / Resume | Spacebar | Tap ⏸ button or swipe while paused |

## 🛠️ Tech Stack

- HTML5
- CSS3 (Grid layout, custom properties/themes, responsive media queries)
- Vanilla JavaScript (no frameworks or build tools)

## 🚀 Running Locally

No build step required — it's a static site.

```bash
git clone https://github.com/rohit73848/snake-game.git
cd snake-game
```

Then simply open `index.html` in your browser, or serve it locally:

```bash
# using Python
python3 -m http.server 5500

# or using VS Code's Live Server extension
```

Visit `http://localhost:5500` in your browser.

## 📁 Project Structure

```
snake-game/
├── index.html      # Markup & structure
├── style.css       # Theming, layout, responsive design
├── script.js        # Game logic, controls, state management
└── README.md
```

## 📈 How Scoring & Levels Work

- Eating food: **+10 points**
- Every **50 points** → level up: speed increases and 2 new obstacles are added
- Game speed starts at 400ms per tick and decreases by 30ms per level (min. 100ms)

## 🤝 Contributing

Issues and pull requests are welcome. If you spot a bug or have an idea for a feature, feel free to open an issue on the [repo](https://github.com/rohit73848/snake-game).

## 📄 License

This project is open source and available for personal and educational use.
