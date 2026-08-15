const board = document.querySelector(".board");
const blockWidth = 50;
const blockHeight = 50;

const cols = Math.floor(board.clientWidth / blockWidth);
const rows = Math.floor(board.clientHeight / blockHeight);

let direction = "down";

const blocksArr = [];
const snake = [
  { x: 1, y: 3 },
  { x: 1, y: 4 },
  { x: 1, y: 5 },
];
for (row = 0; row < rows; row++) {
  for (col = 0; col < cols; col++) {
    const block = document.createElement("div");
    block.classList.add("block");
    board.append(block);
    block.innerText = `${row} : ${col}`;
    blocksArr[`${row} : ${col}`] = block;
  }
}

function render() {
  snake.forEach((segment) => {
    blocksArr[`${segment.x} : ${segment.y}`].classList.add("fill");
  });
}

setInterval(() => {
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

  if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
    alert("Game Over");
  }
  snake.forEach((segment) => {
    blocksArr[`${segment.x} : ${segment.y}`].classList.remove("fill");
  });
  snake.unshift(head);
  snake.pop();
  render();
}, 500);

addEventListener("keydown", (event) => {
  console.log(event.key);
  if (event.key == "ArrowUp") {
    direction = "up";
  } else if (event.key == "ArrowDown") {
    direction = "down";
  } else if (event.key == "ArrowLeft") {
    direction = "left";
  } else if (event.key == "ArrowRight") {
    direction = "right";
  }
});
