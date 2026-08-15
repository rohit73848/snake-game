const board = document.querySelector(".board");
const blockWidth = 50;
const blockHeight = 50;

const cols = Math.floor(board.clientWidth / blockWidth);
const rows = Math.floor(board.clientHeight / blockHeight);

const blocksArr = [];
for (row = 0; row < rows; row++) {
  for (col = 0; col < cols; col++) {
    const block = document.createElement("div");
    block.classList.add("block");
    board.append(block);
    block.innerText = `${row} : ${col}`
    blocksArr[`${row} : ${col}`] = block;
  }
}
console.log(blocksArr)