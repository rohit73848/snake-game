// ================================
// DOM References
// ================================
const board          = document.querySelector(".board");
const modal          = document.getElementById("modal");
const startGameModal = document.getElementById("start-modal");
const gameOverModal  = document.getElementById("game-over-modal");
const pauseOverlay   = document.getElementById("pause-overlay");
const themeSwitcher  = document.getElementById("theme-switcher");
const finalScoreText = document.getElementById("final-score-text");
const boardWrapper   = document.getElementById("board-wrapper");
const btnPause       = document.getElementById("btn-pause");

const highScoreElement = document.getElementById("high-score");
const scoreElement     = document.getElementById("score");
const timeElement      = document.getElementById("time");
const levelElement     = document.getElementById("level");

// ================================
// Touch Device Detection
// ================================
const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
if (isTouchDevice) {
  document.documentElement.classList.add("is-touch");
}

// ================================
// Block Size (responsive: read CSS variable or default to 30)
// ================================
const blockSize = 30;

// Bug Fix 5: cols/rows must account for the board's own padding + border,
// otherwise JS thinks there are more/fewer cells than CSS Grid actually
// creates (auto-fill sizes off the *content* box, not clientWidth/Height).
function getBoardDimensions() {
  const styles = getComputedStyle(board);
  const paddingX =
    parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
  const paddingY =
    parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
  const borderX =
    parseFloat(styles.borderLeftWidth) + parseFloat(styles.borderRightWidth);
  const borderY =
    parseFloat(styles.borderTopWidth) + parseFloat(styles.borderBottomWidth);

  const innerWidth  = board.clientWidth  - paddingX - borderX;
  const innerHeight = board.clientHeight - paddingY - borderY;

  return {
    cols: Math.max(1, Math.floor(innerWidth  / blockSize)),
    rows: Math.max(1, Math.floor(innerHeight / blockSize)),
  };
}

let { cols, rows } = getBoardDimensions();

// ================================
// Game State
// ================================
let direction     = "down";
let nextDirection = "down";   // Buffered input — prevents 180° reversal in one tick
let IntervalId    = null;
let timerIntervalId = null;
let isPaused  = false;
let isRunning = false;

// ================================
// Score / Level / Time
// ================================
let highScore = Number(localStorage.getItem("highScore")) || 0;
let score   = 0;
let level   = 1;
let minutes = 0;
let seconds = 0;

highScoreElement.innerText = highScore;

// ================================
// Board Grid & Game Objects
// ================================
let blocksArr = {};
let snake     = [{ x: 1, y: 3 }];
let obstacles = [];

// Build the grid
function buildGrid() {
  board.innerHTML = "";
  blocksArr = {};
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const block = document.createElement("div");
      block.classList.add("block");
      board.appendChild(block);
      blocksArr[`${row} : ${col}`] = block;
    }
  }
}
buildGrid();

// ================================
// Helper: Format timer display
// ================================
// Bug Fix 2: Consistent timer format - tracking minutes & seconds separately
function formatTime(min, sec) {
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ================================
// Helper: Haptic Feedback (Mobile Vibration API)
// ================================
function hapticFeedback(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

// ================================
// Helper: Generate Food safely
// ================================
// Bug Fix 4: Food will not spawn on top of the snake or obstacles
function generateFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * rows),
      y: Math.floor(Math.random() * cols),
    };
  } while (
    snake.some((seg) => seg.x === newFood.x && seg.y === newFood.y) ||
    obstacles.some((obs) => obs.x === newFood.x && obs.y === newFood.y)
  );
  return newFood;
}

let food = generateFood();

// ================================
// Helper: Generate Obstacles on Level Up
// ================================
function generateObstacles(count) {
  for (let i = 0; i < count; i++) {
    let obs;
    let attempts = 0;
    const maxAttempts = rows * cols; // avoid infinite loop on a nearly-full board
    do {
      obs = {
        x: Math.floor(Math.random() * rows),
        y: Math.floor(Math.random() * cols),
      };
      attempts++;
    } while (
      attempts < maxAttempts &&
      (snake.some((seg) => seg.x === obs.x && seg.y === obs.y) ||
        obstacles.some((o) => o.x === obs.x && o.y === obs.y) ||
        (obs.x === food.x && obs.y === food.y))
    );
    if (attempts >= maxAttempts) return; // board too full, stop adding
    obstacles.push(obs);
    blocksArr[`${obs.x} : ${obs.y}`].classList.add("obstacle");
  }
}

// ================================
// Helper: Speed based on Level
// ================================
function getSpeed() {
  // Starts at 400ms, drops 30ms per level, minimum 100ms
  return Math.max(100, 400 - (level - 1) * 30);
}

// ================================
// Level Up Effect
// ================================
function triggerLevelUp() {
  board.classList.add("level-up");
  setTimeout(() => board.classList.remove("level-up"), 600);
  generateObstacles(2); // 2 new obstacles per level
  hapticFeedback([50, 30, 80]); // Double pulse vibration on level up
}

// ================================
// Game Over
// ================================
function gameOver() {
  clearInterval(IntervalId);
  clearInterval(timerIntervalId); // Bug Fix 3: Clear timer on game over
  isRunning = false;
  isPaused  = false;
  pauseOverlay.classList.remove("active");
  btnPause.classList.remove("is-paused");

  finalScoreText.textContent =
    `Score: ${score}  ·  Level: ${level}  ·  Time: ${formatTime(minutes, seconds)}`;

  modal.style.display = "flex";
  startGameModal.style.display = "none";
  gameOverModal.style.display  = "flex";

  hapticFeedback([100, 50, 100, 50, 250]); // Game over vibration pattern
}

// ================================
// Main Render Loop
// ================================
function render() {
  // Apply buffered direction
  direction = nextDirection;

  // Ensure food is always visible
  blocksArr[`${food.x} : ${food.y}`].classList.add("food");

  // Calculate next head position
  let head;
  switch (direction) {
    case "left":  head = { x: snake[0].x,     y: snake[0].y - 1 }; break;
    case "right": head = { x: snake[0].x,     y: snake[0].y + 1 }; break;
    case "down":  head = { x: snake[0].x + 1, y: snake[0].y     }; break;
    case "up":    head = { x: snake[0].x - 1, y: snake[0].y     }; break;
  }

  // Wall collision check
  if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
    gameOver();
    return;
  }

  const ateFood = head.x === food.x && head.y === food.y;

  // Bug Fix 6: Self-collision must ignore the tail cell when the snake
  // ISN'T growing this tick, because that cell is about to become empty
  // (snake.pop() below). Checking against the full array caused random
  // false "game over"s when moving into the current tail position.
  const bodyToCheck = ateFood ? snake : snake.slice(0, -1);
  if (bodyToCheck.some((seg) => seg.x === head.x && seg.y === head.y)) {
    gameOver();
    return;
  }

  // Obstacle collision check
  if (obstacles.some((obs) => obs.x === head.x && obs.y === head.y)) {
    gameOver();
    return;
  }

  // Remove previous head highlight before moving
  blocksArr[`${snake[0].x} : ${snake[0].y}`].classList.remove("snake-head");

  if (ateFood) {
    // Snake eats food → grow
    blocksArr[`${food.x} : ${food.y}`].classList.remove("food");
    snake.unshift(head);
    blocksArr[`${head.x} : ${head.y}`].classList.add("fill", "snake-head");

    food = generateFood(); // Bug Fix 4: Safe food generation
    blocksArr[`${food.x} : ${food.y}`].classList.add("food");

    // Update score
    score += 10;
    scoreElement.innerText = score;
    hapticFeedback(35); // Short buzz on food eat

    // Level up check: every 50 points
    const newLevel = Math.floor(score / 50) + 1;
    if (newLevel > level) {
      level = newLevel;
      levelElement.innerText = level;
      clearInterval(IntervalId);
      IntervalId = setInterval(render, getSpeed());
      triggerLevelUp();
    }

    // High score
    if (score > highScore) {
      highScore = score;
      highScoreElement.innerText = highScore;
      localStorage.setItem("highScore", highScore.toString());
    }
  } else {
    // Normal move → shift snake forward
    const tail = snake[snake.length - 1];
    blocksArr[`${tail.x} : ${tail.y}`].classList.remove("fill");

    snake.unshift(head);
    snake.pop();

    blocksArr[`${head.x} : ${head.y}`].classList.add("fill", "snake-head");
  }
}

// ================================
// Timer
// ================================
function startTimer() {
  // Bug Fix 3: Clear previous timer before starting a new one
  clearInterval(timerIntervalId);
  timerIntervalId = setInterval(() => {
    seconds += 1;
    if (seconds === 60) {
      minutes += 1;
      seconds = 0;
    }
    timeElement.innerText = formatTime(minutes, seconds);
  }, 1000);
}

// ================================
// Pause / Play Feature
// (Spacebar · D-pad center button)
// ================================
function togglePause() {
  if (!isRunning) return;

  if (isPaused) {
    // Resume
    isPaused = false;
    pauseOverlay.classList.remove("active");
    btnPause.classList.remove("is-paused");
    IntervalId = setInterval(render, getSpeed());
    startTimer();
    hapticFeedback(20); // Tiny confirm buzz
  } else {
    // Pause
    isPaused = true;
    pauseOverlay.classList.add("active");
    btnPause.classList.add("is-paused");
    clearInterval(IntervalId);
    clearInterval(timerIntervalId); // Bug Fix 3: Also pause the timer
    hapticFeedback(20);
  }
}

// ================================
// Start Game
// ================================
document.getElementById("start-btn").addEventListener("click", () => {
  modal.style.display = "none";
  isRunning = true;
  IntervalId = setInterval(render, getSpeed());
  startTimer();
});

// ================================
// Restart Game
// ================================
document.getElementById("restart-btn").addEventListener("click", restartGame);

function restartGame() {
  // Recompute grid in case the viewport changed since the last game
  // (e.g. orientation flip, browser chrome show/hide, font reflow).
  const dims = getBoardDimensions();
  cols = dims.cols;
  rows = dims.rows;
  buildGrid();

  // Reset all state
  score     = 0;
  level     = 1;
  minutes   = 0;  // Bug Fix 2: Reset minutes & seconds
  seconds   = 0;
  isPaused  = false;
  isRunning = true;
  direction     = "down";
  nextDirection = "down";

  // Update DOM
  scoreElement.innerText  = score;
  levelElement.innerText  = level;
  timeElement.innerText   = formatTime(minutes, seconds);
  highScoreElement.innerText = highScore;
  pauseOverlay.classList.remove("active");
  btnPause.classList.remove("is-paused");
  modal.style.display = "none";

  // Reset game objects
  snake     = [{ x: 1, y: 3 }];
  obstacles = [];
  food      = generateFood(); // Bug Fix 4: Safe food generation

  // Bug Fix 3: Clear old intervals before starting new ones
  clearInterval(IntervalId);
  IntervalId = setInterval(render, getSpeed());
  startTimer();
}

// ================================
// Resize / Orientation Handling
// ================================
// Bug Fix 7: cols/rows were only ever computed once at script load, before
// fonts/layout had settled (especially on mobile). Any later resize,
// rotation, or browser-chrome show/hide left the grid out of sync with
// the actual rendered board size. We rebuild the grid on resize, but only
// when the game isn't actively running (to avoid disrupting play), and we
// always rebuild before a fresh game starts via restartGame().
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const dims = getBoardDimensions();
    if (dims.cols === cols && dims.rows === rows) return; // nothing changed

    cols = dims.cols;
    rows = dims.rows;

    if (!isRunning) {
      // Safe to rebuild immediately (e.g. still on the start screen)
      buildGrid();
      food = generateFood();
    }
    // If a game is running, the new grid size will be applied next
    // restartGame() call to avoid yanking the board out from under the
    // player mid-move.
  }, 150);
});

// ================================
// Theme Switcher
// ================================
const savedTheme = localStorage.getItem("snakeTheme") || "cyberpunk";
document.documentElement.setAttribute("data-theme", savedTheme);
themeSwitcher.value = savedTheme;

themeSwitcher.addEventListener("change", () => {
  const selected = themeSwitcher.value;
  document.documentElement.setAttribute("data-theme", selected);
  localStorage.setItem("snakeTheme", selected);
});

// ================================
// Keyboard Controls (Desktop)
// ================================
document.addEventListener("keydown", (event) => {
  // Spacebar: Pause / Play
  if (event.key === " " || event.key === "Spacebar") {
    event.preventDefault();
    togglePause();
    return;
  }

  // Ignore direction keys while paused
  if (isPaused) return;

  // Buffer next direction to prevent 180-degree reversal
  switch (event.key) {
    case "ArrowUp":    if (direction !== "down")  nextDirection = "up";    break;
    case "ArrowDown":  if (direction !== "up")    nextDirection = "down";  break;
    case "ArrowLeft":  if (direction !== "right") nextDirection = "left";  break;
    case "ArrowRight": if (direction !== "left")  nextDirection = "right"; break;
  }
});

// ================================
// D-Pad Button Controls (Mobile)
// ================================
function setDpadDirection(newDir, opposite) {
  if (!isRunning || isPaused) return;
  if (direction !== opposite) {
    nextDirection = newDir;
    hapticFeedback(8); // Tiny tap feedback
  }
}

document.getElementById("btn-up").addEventListener("click",    () => setDpadDirection("up",    "down"));
document.getElementById("btn-down").addEventListener("click",  () => setDpadDirection("down",  "up"));
document.getElementById("btn-left").addEventListener("click",  () => setDpadDirection("left",  "right"));
document.getElementById("btn-right").addEventListener("click", () => setDpadDirection("right", "left"));
btnPause.addEventListener("click", togglePause);

// ================================
// Swipe Gesture Controls (Mobile)
// ================================
let touchStartX = 0;
let touchStartY = 0;
const SWIPE_THRESHOLD = 25; // Minimum px to register as swipe

boardWrapper.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  e.preventDefault(); // Stop Default Mobile Scrolling
}, { passive: false });

boardWrapper.addEventListener("touchend", (e) => {
  if (!isRunning) return;

  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Ignore tiny taps
  if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) return;

  // If paused, any swipe resumes
  if (isPaused) {
    togglePause();
    return;
  }

  if (absDx > absDy) {
    // Horizontal swipe
    if (dx > 0) setDpadDirection("right", "left");
    else         setDpadDirection("left",  "right");
  } else {
    // Vertical swipe
    if (dy > 0) setDpadDirection("down", "up");
    else         setDpadDirection("up",   "down");
  }

  e.preventDefault();
}, { passive: false });

// Stop touchmove from scrolling the page during gameplay
boardWrapper.addEventListener("touchmove", (e) => {
  e.preventDefault();
}, { passive: false });

// ================================
// Auto-Pause on App Switch
// (Page Visibility API)
// ================================
document.addEventListener("visibilitychange", () => {
  if (document.hidden && isRunning && !isPaused) {
    togglePause();
  }
});

// Also pause when window loses focus (desktop tab switch)
window.addEventListener("blur", () => {
  if (isRunning && !isPaused) {
    togglePause();
  }
});