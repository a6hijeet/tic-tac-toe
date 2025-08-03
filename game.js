const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusDiv = document.getElementById('status');
const playerSelect = document.getElementById('playerSelect');
const difficultySelect = document.getElementById('difficultySelect');
const autoRestartCheckbox = document.getElementById('autoRestart');

let difficulty = difficultySelect.value;

difficultySelect.addEventListener('change', () => {
  difficulty = difficultySelect.value;
  resetGame();
});

let board = Array(9).fill('');
let player = 'X';
let ai = 'O';
let current = 'X';
let gameOver = false;

let scores = { player: 0, ai: 0, draw: 0 };

canvas.addEventListener('click', handleClick);
playerSelect.addEventListener('change', () => {
  player = playerSelect.value;
  ai = player === 'X' ? 'O' : 'X';
  resetGame();
});

function toggleTheme() {
  document.body.classList.toggle('dark');
}

function resetGame() {
  board = Array(9).fill('');
  gameOver = false;
  current = 'X';
  statusDiv.textContent = `${player === current ? 'Your' : 'AI'} Turn`;
  drawBoard();
  if (ai === current) aiMove();
}

function drawBoard() {
  ctx.clearRect(0, 0, 300, 300);
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--line-color');
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 100, 0);
    ctx.lineTo(i * 100, 300);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * 100);
    ctx.lineTo(300, i * 100);
    ctx.stroke();
  }
  board.forEach((cell, i) => {
    if (cell) drawSymbol(cell, i);
  });
}

function drawSymbol(sym, idx) {
  const x = (idx % 3) * 100 + 50;
  const y = Math.floor(idx / 3) * 100 + 50;
  ctx.lineWidth = 4;
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
  if (sym === 'X') {
    ctx.beginPath();
    ctx.moveTo(x - 25, y - 25);
    ctx.lineTo(x + 25, y + 25);
    ctx.moveTo(x + 25, y - 25);
    ctx.lineTo(x - 25, y + 25);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, 2 * Math.PI);
    ctx.stroke();
  }
}

function handleClick(e) {
  if (gameOver || current !== player) return;
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / 100);
  const y = Math.floor((e.clientY - rect.top) / 100);
  const idx = y * 3 + x;
  if (board[idx]) return;
  makeMove(idx, player);
  if (!gameOver) aiMove();
}

function makeMove(idx, sym) {
  board[idx] = sym;
  drawBoard();
  const result = checkWinner(board);
  if (result) {
    gameOver = true;
    highlightWinner(result.line);
    updateScore(result.winner);
  } else if (board.every(cell => cell)) {
    gameOver = true;
    updateScore('draw');
  } else {
    current = current === 'X' ? 'O' : 'X';
    statusDiv.textContent = `${player === current ? 'Your' : 'AI'} Turn`;
  }
}

function aiMove() {
  const idx = getBestMove(board, ai);
  setTimeout(() => makeMove(idx, ai), 300);
}

function getBestMove(b, aiPlayer) {
  const humanPlayer = aiPlayer === 'X' ? 'O' : 'X';

  function minimax(board, depth, isMaximizing) {
    const result = checkWinner(board);
    if (result) {
      if (result.winner === aiPlayer) return { score: 10 - depth };
      if (result.winner === humanPlayer) return { score: depth - 10 };
      return { score: 0 };
    }

    let moves = [];
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = isMaximizing ? aiPlayer : humanPlayer;
        const score = minimax(board, depth + 1, !isMaximizing).score;
        moves.push({ idx: i, score });
        board[i] = '';
      }
    }

    return isMaximizing
      ? moves.reduce((a, b) => (a.score > b.score ? a : b))
      : moves.reduce((a, b) => (a.score < b.score ? a : b));
  }

  // Always try to block immediate threats or win
  function findImmediateWinOrBlock(symbol) {
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = symbol;
        const result = checkWinner(b);
        b[i] = '';
        if (result?.winner === symbol) return i;
      }
    }
    return -1;
  }

  // 1. Try to win immediately
  const winIdx = findImmediateWinOrBlock(aiPlayer);
  if (winIdx !== -1) return winIdx;

  // 2. Try to block opponent
  const blockIdx = findImmediateWinOrBlock(humanPlayer);
  if (blockIdx !== -1) return blockIdx;

  const empty = b.map((v, i) => v === '' ? i : null).filter(v => v !== null);

  // Easy: 80% random, 20% minimax
  if (difficulty === 'easy') {
    if (Math.random() < 0.8) {
      return empty[Math.floor(Math.random() * empty.length)];
    }
  }

  // Beginner: 50% minimax, 50% random
  if (difficulty === 'beginner') {
    if (Math.random() < 0.5) {
      return empty[Math.floor(Math.random() * empty.length)];
    }
  }

  // Hard or fallback: use minimax
  return minimax(b, 0, true).idx;
}



function checkWinner(board) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let line of wins) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  if (board.every(cell => cell)) return { winner: 'draw', line: [] };
  return null;
}


function highlightWinner(line) {
  ctx.fillStyle = 'rgba(255,255,0,0.2)';
  for (let idx of line) {
    const x = (idx % 3) * 100;
    const y = Math.floor(idx / 3) * 100;
    ctx.fillRect(x, y, 100, 100);
  }
}

function updateScore(winner) {
  if (winner === player) scores.player++;
  else if (winner === ai) scores.ai++;
  else scores.draw++;

  document.getElementById('playerScore').textContent = `You: ${scores.player}`;
  document.getElementById('aiScore').textContent = `AI: ${scores.ai}`;
  document.getElementById('draws').textContent = `Draws: ${scores.draw}`;
  statusDiv.textContent = winner === 'draw' ? "It's a Draw!" :
    (winner === player ? "You Win!" : "AI Wins!");

  if (autoRestartCheckbox.checked) {
    setTimeout(() => resetGame(), 1500);
  }
}

resetGame();
