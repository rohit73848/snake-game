const board = document.querySelector(".board");
const startButton = document.querySelector(".btn-start");
const restartButton = document.querySelector(".btn-restart");
const modal = document.querySelector(".modal");
const startGameModal = document.querySelector(".start-game");
const gameOverModal = document.querySelector(".game-over");

const blockWidth = 30;
const blockHeight = 30;

const cols = Math.floor(board.clientWidth / blockWidth);
const rows = Math.floor(board.clientHeight / blockHeight);

let direction = "down";
let IntervalId = null;
let timerIntervalId = null;
const highScoreElement = document.querySelector("#high-score");
const scoreElement = document.querySelector("#score");
const timeElement = document.querySelector("#time");

let highScore = localStorage.getItem("highScore") || 0;
let score = 0;
let minutes = 0;
let seconds = 0;

highScoreElement.innerText = highScore;

const blocksArr = [];
let snake = [{ x: 1, y: 3 }];

// Bug Fix 4: Food will not spawn on top of the snake
function generateFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * rows),
      y: Math.floor(Math.random() * cols),
    };
  } while (snake.some((seg) => seg.x === newFood.x && seg.y === newFood.y));
  return newFood;
}

let food = generateFood();

for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const block = document.createElement("div");
    block.classList.add("block");
    board.append(block);
    blocksArr[`${row} : ${col}`] = block;
  }
}

// Bug Fix 2: Consistent timer format - tracking minutes & seconds separately
function formatTime(min, sec) {
  const mm = String(min).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return `${mm}:${ss}`;
}

function gameOver() {
  clearInterval(IntervalId);
  clearInterval(timerIntervalId); // Bug Fix 3: timer o clear hobe game over e
  modal.style.display = "flex";
  startGameModal.style.display = "none";
  gameOverModal.style.display = "flex";
}

function render() {
  blocksArr[`${food.x} : ${food.y}`].classList.add("food");

  let head = null;
  if (direction === "left") {
    head = { x: snake[0].x, y: snake[0].y - 1 };
  } else if (direction === "right") {
    head = { x: snake[0].x, y: snake[0].y + 1 };
  } else if (direction === "down") {
    head = { x: snake[0].x + 1, y: snake[0].y };
  } else if (direction === "up") {
    head = { x: snake[0].x - 1, y: snake[0].y };
  }

  // Wall collision check
  if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
    gameOver();
    return;
  }

  // Bug Fix 1: Self-collision check
  const hitSelf = snake.some((seg) => seg.x === head.x && seg.y === head.y);
  if (hitSelf) {
    gameOver();
    return;
  }

  // Food Consume Logic
  if (head.x === food.x && head.y === food.y) {
    blocksArr[`${food.x} : ${food.y}`].classList.remove("food");
    food = generateFood(); // Bug Fix 4: Safe food generation
    blocksArr[`${food.x} : ${food.y}`].classList.add("food");
    snake.unshift(head);
    score += 10;
    scoreElement.innerText = score;
    if (score > highScore) {
      highScore = score;
      highScoreElement.innerText = highScore;
      localStorage.setItem("highScore", highScore.toString());
    }
    return;
  }

  snake.forEach((segment) => {
    blocksArr[`${segment.x} : ${segment.y}`].classList.remove("fill");
  });
  snake.unshift(head);
  snake.pop();

  snake.forEach((segment) => {
    blocksArr[`${segment.x} : ${segment.y}`].classList.add("fill");
  });
}

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

startButton.addEventListener("click", () => {
  modal.style.display = "none";
  IntervalId = setInterval(() => {
    render();
  }, 400);
  startTimer();
});

restartButton.addEventListener("click", restartGame);

function restartGame() {
  // Clear board visuals
  blocksArr[`${food.x} : ${food.y}`].classList.remove("food");
  snake.forEach((segment) => {
    blocksArr[`${segment.x} : ${segment.y}`].classList.remove("fill");
  });

  // Reset state
  score = 0;
  minutes = 0; // Bug Fix 2: Reset minutes & seconds
  seconds = 0;
  scoreElement.innerText = score;
  timeElement.innerText = formatTime(minutes, seconds);
  highScoreElement.innerText = highScore;
  direction = "down";
  modal.style.display = "none";
  snake = [{ x: 1, y: 3 }];
  food = generateFood(); // Bug Fix 4: Safe food generation

  // Bug Fix 3: Clear old intervals before starting new ones
  clearInterval(IntervalId);
  IntervalId = setInterval(() => {
    render();
  }, 350);
  startTimer();
}

addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp" && direction !== "down") {
    direction = "up";
  } else if (event.key === "ArrowDown" && direction !== "up") {
    direction = "down";
  } else if (event.key === "ArrowLeft" && direction !== "right") {
    direction = "left";
  } else if (event.key === "ArrowRight" && direction !== "left") {
    direction = "right";
  }
});
