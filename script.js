const board = document.querySelector(".board");
const startButton = document.querySelector(".btn-start");
const restartButton = document.querySelector(".btn-restart");
const modal = document.querySelector(".modal");
const startGameModal = document.querySelector(".start-game");
const gameOverModal = document.querySelector(".game-over");
const pauseOverlay = document.getElementById("pause-overlay");
const themeSwitcher = document.getElementById("theme-switcher");
const finalScoreText = document.getElementById("final-score-text");

const blockWidth = 30;
const blockHeight = 30;

const cols = Math.floor(board.clientWidth / blockWidth);
const rows = Math.floor(board.clientHeight / blockHeight);

// ================================
// Game State
// ================================
let direction = "down";
let nextDirection = "down"; // Buffer to prevent double-reverse in same tick
let IntervalId = null;
let timerIntervalId = null;
let isPaused = false;
let isRunning = false;

// ================================
// DOM References
// ================================
const highScoreElement = document.querySelector("#high-score");
const scoreElement = document.querySelector("#score");
const timeElement = document.querySelector("#time");
const levelElement = document.querySelector("#level");

// ================================
// Score / Level / Time State
// ================================
let highScore = localStorage.getItem("highScore") || 0;
let score = 0;
let level = 1;
let minutes = 0;
let seconds = 0;

highScoreElement.innerText = highScore;

// ================================
// Board & Game Objects
// ================================
const blocksArr = [];
let snake = [{ x: 1, y: 3 }];
let obstacles = [];

// Build grid blocks
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const block = document.createElement("div");
    block.classList.add("block");
    board.append(block);
    blocksArr[`${row} : ${col}`] = block;
  }
}

// ================================
// Helper: Format Timer
// ================================
// Bug Fix 2: Consistent timer format - tracking minutes & seconds separately
function formatTime(min, sec) {
  const mm = String(min).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return `${mm}:${ss}`;
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
// Helper: Add Obstacles on Level Up
// ================================
function generateObstacles(count) {
  for (let i = 0; i < count; i++) {
    let obs;
    do {
      obs = {
        x: Math.floor(Math.random() * rows),
        y: Math.floor(Math.random() * cols),
      };
    } while (
      snake.some((seg) => seg.x === obs.x && seg.y === obs.y) ||
      obstacles.some((o) => o.x === obs.x && o.y === obs.y) ||
      (obs.x === food.x && obs.y === food.y)
    );
    obstacles.push(obs);
    blocksArr[`${obs.x} : ${obs.y}`].classList.add("obstacle");
  }
}

// ================================
// Helper: Speed based on Level
// ================================
function getSpeed() {
  // Starts at 400ms, drops 30ms per level, min 100ms
  return Math.max(100, 400 - (level - 1) * 30);
}

// ================================
// Game Over
// ================================
function gameOver() {
  clearInterval(IntervalId);
  clearInterval(timerIntervalId); // Bug Fix 3: Clear timer on game over
  isRunning = false;
  isPaused = false;
  pauseOverlay.classList.remove("active");
  finalScoreText.textContent = `Score: ${score}  ·  Level: ${level}  ·  Time: ${formatTime(minutes, seconds)}`;
  modal.style.display = "flex";
  startGameModal.style.display = "none";
  gameOverModal.style.display = "flex";
}

// ================================
// Level Up Effect
// ================================
function triggerLevelUp() {
  board.classList.add("level-up");
  setTimeout(() => board.classList.remove("level-up"), 600);
  generateObstacles(2); // Add 2 new obstacles each level
}

// ================================
// Main Render Loop
// ================================
function render() {
  // Apply buffered direction
  direction = nextDirection;

  // Make sure food is always visible
  blocksArr[`${food.x} : ${food.y}`].classList.add("food");

  // Calculate next head position
  let head;
  switch (direction) {
    case "left":  head = { x: snake[0].x, y: snake[0].y - 1 }; break;
    case "right": head = { x: snake[0].x, y: snake[0].y + 1 }; break;
    case "down":  head = { x: snake[0].x + 1, y: snake[0].y }; break;
    case "up":    head = { x: snake[0].x - 1, y: snake[0].y }; break;
  }

  // Wall collision check
  if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
    gameOver();
    return;
  }

  // Bug Fix 1: Self-collision check
  if (snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
    gameOver();
    return;
  }

  // Obstacle collision check
  if (obstacles.some((obs) => obs.x === head.x && obs.y === head.y)) {
    gameOver();
    return;
  }

  const ateFood = head.x === food.x && head.y === food.y;

  // Remove old head highlight before moving
  blocksArr[`${snake[0].x} : ${snake[0].y}`].classList.remove("snake-head");

  if (ateFood) {
    // --- Snake eats food: grow ---
    blocksArr[`${food.x} : ${food.y}`].classList.remove("food");
    snake.unshift(head);
    blocksArr[`${head.x} : ${head.y}`].classList.add("fill", "snake-head");

    // Bug Fix 4: Safe food generation
    food = generateFood();
    blocksArr[`${food.x} : ${food.y}`].classList.add("food");

    // Update score
    score += 10;
    scoreElement.innerText = score;

    // Level up: every 50 points
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
    // --- Normal move: shift snake ---
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
// Pause / Play Feature (Spacebar)
// ================================
function togglePause() {
  if (!isRunning) return;

  if (isPaused) {
    // Resume game
    isPaused = false;
    pauseOverlay.classList.remove("active");
    IntervalId = setInterval(render, getSpeed());
    startTimer();
  } else {
    // Pause game
    isPaused = true;
    pauseOverlay.classList.add("active");
    clearInterval(IntervalId);
    clearInterval(timerIntervalId); // Bug Fix 3: Also clear timer on pause
  }
}

// ================================
// Start Button
// ================================
startButton.addEventListener("click", () => {
  modal.style.display = "none";
  isRunning = true;
  IntervalId = setInterval(render, getSpeed());
  startTimer();
});

// ================================
// Restart Game
// ================================
restartButton.addEventListener("click", restartGame);

function restartGame() {
  // Clear board visuals
  blocksArr[`${food.x} : ${food.y}`].classList.remove("food");
  snake.forEach((seg) => {
    blocksArr[`${seg.x} : ${seg.y}`].classList.remove("fill", "snake-head");
  });
  obstacles.forEach((obs) => {
    blocksArr[`${obs.x} : ${obs.y}`].classList.remove("obstacle");
  });

  // Reset state
  score = 0;
  level = 1;
  minutes = 0; // Bug Fix 2: Reset minutes & seconds
  seconds = 0;
  isPaused = false;
  isRunning = true;
  direction = "down";
  nextDirection = "down";

  // Reset DOM
  scoreElement.innerText = score;
  levelElement.innerText = level;
  timeElement.innerText = formatTime(minutes, seconds);
  highScoreElement.innerText = highScore;
  pauseOverlay.classList.remove("active");
  modal.style.display = "none";

  // Reset game objects
  snake = [{ x: 1, y: 3 }];
  obstacles = [];
  food = generateFood(); // Bug Fix 4: Safe food generation

  // Bug Fix 3: Clear old intervals before starting new ones
  clearInterval(IntervalId);
  IntervalId = setInterval(render, getSpeed());
  startTimer();
}

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
// Keyboard Controls
// ================================
addEventListener("keydown", (event) => {
  // Spacebar: Pause / Play
  if (event.key === " " || event.key === "Spacebar") {
    event.preventDefault();
    togglePause();
    return;
  }

  // Ignore direction keys when paused
  if (isPaused) return;

  // Buffer next direction to prevent 180-degree reverse
  if (event.key === "ArrowUp" && direction !== "down") {
    nextDirection = "up";
  } else if (event.key === "ArrowDown" && direction !== "up") {
    nextDirection = "down";
  } else if (event.key === "ArrowLeft" && direction !== "right") {
    nextDirection = "left";
  } else if (event.key === "ArrowRight" && direction !== "left") {
    nextDirection = "right";
  }
});
