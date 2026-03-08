const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
let level = 1;
let maze = [];
let player = { x: 0, y: 0 };
let realExit = { x: 0, y: 0 };
let falseExits = [];
let cols, rows, cellSize;

function setDimensions() {
    cols = 13 + level * 2; // start with 15x15, increase by 2 each level (bigger and harder)
    rows = cols;
    cellSize = Math.floor(canvas.width / cols);
    realExit = { x: cols - 1, y: rows - 1 };
    falseExits = [];
    // Add 2-3 false exits depending on level
    const numFalse = Math.min(3, Math.floor(level / 2) + 1);
    for (let i = 0; i < numFalse; i++) {
        let fx, fy;
        let attempts = 0;
        do {
            fx = Math.floor(Math.random() * cols);
            fy = Math.floor(Math.random() * rows);
            attempts++;
        } while (attempts < 50 && (maze[fy][fx] === 1 || (fx === 0 && fy === 0) || (fx === realExit.x && fy === realExit.y) || falseExits.some(f => f.x === fx && f.y === fy)));
        if (attempts < 50) falseExits.push({ x: fx, y: fy });
    }
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
    // Draw grass background
    ctx.fillStyle = '#90EE90'; // light green
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set font for emojis
    ctx.font = `${cellSize * 0.8}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (maze[i][j] === 1) {
                // Draw tree wall
                ctx.fillText('🌳', j * cellSize + cellSize / 2, i * cellSize + cellSize / 2);
            }
        }
    }
    // Draw exits (homes)
    ctx.fillText('🏠', realExit.x * cellSize + cellSize / 2, realExit.y * cellSize + cellSize / 2);
    for (let f of falseExits) {
        ctx.fillText('🏠', f.x * cellSize + cellSize / 2, f.y * cellSize + cellSize / 2);
    }
    // Draw player (rabbit)
    ctx.fillText('🐰', player.x * cellSize + cellSize / 2, player.y * cellSize + cellSize / 2);
}

function checkWin() {
    if (player.x === realExit.x && player.y === realExit.y) {
        document.getElementById('message').textContent = '🐰 Rabbit reached the real home! 🏠';
        document.getElementById('nextLevel').style.display = 'block';
    } else {
        for (let f of falseExits) {
            if (player.x === f.x && player.y === f.y) {
                document.getElementById('message').textContent = 'Wrong home! Find the real one!';
                setTimeout(() => {
                    player = { x: 0, y: 0 };
                    drawMaze();
                    document.getElementById('message').textContent = '';
                }, 2000);
                return true; // blocked
            }
        }
    }
    return false;
}

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
        checkWin();
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
            checkWin();
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