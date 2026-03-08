const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
let level = 1;
let maze = [];
let player = { x: 0, y: 0 };
let exit = { x: 0, y: 0 };
let cols, rows, cellSize;

function setDimensions() {
    cols = 13 + level * 2; // start with 15x15, increase by 2 each level (bigger and harder)
    rows = cols;
    cellSize = Math.floor(canvas.width / cols);
    exit = { x: cols - 1, y: rows - 1 };
}

const directions = [
    { x: 0, y: -1 }, // up
    { x: 1, y: 0 },  // right
    { x: 0, y: 1 },  // down
    { x: -1, y: 0 }  // left
];

function generateMaze() {
    maze = Array(rows).fill().map(() => Array(cols).fill(1)); // all walls
    const stack = [];
    const start = { x: 0, y: 0 };
    maze[0][0] = 0;
    stack.push(start);
    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const neighbors = [];
        for (let dir of directions) {
            const nx = current.x + dir.x * 2;
            const ny = current.y + dir.y * 2;
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && maze[ny][nx] === 1) {
                neighbors.push({ x: nx, y: ny, wallx: current.x + dir.x, wally: current.y + dir.y });
            }
        }
        if (neighbors.length > 0) {
            const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
            maze[chosen.wally][chosen.wallx] = 0;
            maze[chosen.y][chosen.x] = 0;
            stack.push({ x: chosen.x, y: chosen.y });
        } else {
            stack.pop();
        }
    }
    // Ensure exit is reachable, but algorithm should make it so
}

function drawMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (maze[i][j] === 1) {
                ctx.fillStyle = '#000';
                ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
            }
        }
    }
    // Draw player
    ctx.fillStyle = 'red';
    ctx.fillRect(player.x * cellSize, player.y * cellSize, cellSize, cellSize);
    // Draw exit
    ctx.fillStyle = 'green';
    ctx.fillRect(exit.x * cellSize, exit.y * cellSize, cellSize, cellSize);
}

let dragging = false;

function canMoveTo(tx, ty) {
    if (tx < 0 || tx >= cols || ty < 0 || ty >= rows || maze[ty][tx] === 1) return false;
    if (tx === player.x && ty === player.y) return false; // already there
    if (tx === player.x) { // same column, vertical move
        const start = Math.min(player.y, ty);
        const end = Math.max(player.y, ty);
        for (let i = start; i <= end; i++) {
            if (maze[i][tx] === 1) return false;
        }
        return true;
    } else if (ty === player.y) { // same row, horizontal move
        const start = Math.min(player.x, tx);
        const end = Math.max(player.x, tx);
        for (let i = start; i <= end; i++) {
            if (maze[ty][i] === 1) return false;
        }
        return true;
    }
    return false; // diagonal not allowed for drag
}

canvas.addEventListener('mousedown', (e) => {
    dragging = true;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    if (canMoveTo(x, y)) {
        player.x = x;
        player.y = y;
        drawMaze();
        if (player.x === exit.x && player.y === exit.y) {
            document.getElementById('message').textContent = 'You win!';
            document.getElementById('nextLevel').style.display = 'block';
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (dragging) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / cellSize);
        const y = Math.floor((e.clientY - rect.top) / cellSize);
        if (canMoveTo(x, y)) {
            player.x = x;
            player.y = y;
            drawMaze();
            if (player.x === exit.x && player.y === exit.y) {
                document.getElementById('message').textContent = 'You win!';
                document.getElementById('nextLevel').style.display = 'block';
            }
        }
    }
});

canvas.addEventListener('mouseup', () => {
    dragging = false;
});

document.getElementById('nextLevel').addEventListener('click', () => {
    level++;
    document.getElementById('level').textContent = 'Level: ' + level;
    document.getElementById('message').textContent = '';
    document.getElementById('nextLevel').style.display = 'none';
    setDimensions();
    generateMaze();
    player = { x: 0, y: 0 };
    drawMaze();
});

// Initial setup
setDimensions();
generateMaze();
drawMaze();