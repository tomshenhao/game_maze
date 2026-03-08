let mazeContainer, cells;

function initMazeDisplay() {
    mazeContainer = document.getElementById('mazeContainer');
    if (!mazeContainer) {
        document.body.innerHTML = '<h1>Maze container not found</h1>';
        return;
    }
    mazeContainer.innerHTML = '';
    let table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.margin = '0 auto';
    table.style.border = '2px solid #000';
    cells = [];
    for (let i = 0; i < rows; i++) {
        let tr = document.createElement('tr');
        cells[i] = [];
        for (let j = 0; j < cols; j++) {
            let td = document.createElement('td');
            td.style.width = cellSize + 'px';
            td.style.height = cellSize + 'px';
            td.style.border = '1px solid #ccc';
            td.style.backgroundColor = '#fff';
            tr.appendChild(td);
            cells[i][j] = td;
        }
        table.appendChild(tr);
    }
    mazeContainer.appendChild(table);
}
let level = 1;
let maze = [];
let player = { x: 0, y: 0 };
let realExit = { x: 0, y: 0 };
let wolf = { x: 0, y: 0 };
let carrots = [];
let cols, rows, cellSize;
let dragging = false;
let score = 0;

function setDimensions() {
    cols = 19 + level * 2; // start with 21x21, increase by 2 each level (even bigger mazes)
    rows = cols;
    cellSize = 20; // fixed cell size for table
    realExit = { x: Math.floor(cols / 2), y: Math.floor(rows / 2) }; // center of maze
    wolf = { x: cols - 1, y: rows - 1 }; // wolf starts at bottom-right
    initMazeDisplay();
}

function setCarrots() {
    carrots = [];
    // Add 2-3 carrots depending on level
    const numCarrots = Math.min(4, 2 + Math.floor(level / 2));
    for (let i = 0; i < numCarrots; i++) {
        let cx, cy;
        let attempts = 0;
        do {
            cx = Math.floor(Math.random() * cols);
            cy = Math.floor(Math.random() * rows);
            attempts++;
        } while (attempts < 50 && (maze[cy][cx] === 1 || (cx === 0 && cy === 0) || (cx === realExit.x && cy === realExit.y) || (cx === cols - 1 && cy === rows - 1) || carrots.some(c => c.x === cx && c.y === cy)));
        if (attempts < 50) carrots.push({ x: cx, y: cy });
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
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (maze[i][j] === 1) {
                cells[i][j].style.backgroundColor = '#000';
            } else {
                cells[i][j].style.backgroundColor = '#fff';
            }
        }
    }
    // Draw exit (house)
    cells[realExit.y][realExit.x].style.backgroundColor = 'green';
    // Draw carrots
    for (let c of carrots) {
        cells[c.y][c.x].style.backgroundColor = 'orange';
    }
    // Draw player (rabbit)
    cells[player.y][player.x].style.backgroundColor = 'red';
    // Draw wolf
    cells[wolf.y][wolf.x].style.backgroundColor = 'blue';
}

function checkWin() {
    if (player.x === realExit.x && player.y === realExit.y) {
        document.getElementById('message').textContent = 'Rabbit reached home first!';
        document.getElementById('nextLevel').style.display = 'block';
        clearInterval(wolfInterval); // stop wolf movement
    } else {
        // Check for carrots
        for (let i = carrots.length - 1; i >= 0; i--) {
            if (player.x === carrots[i].x && player.y === carrots[i].y) {
                carrots.splice(i, 1); // remove carrot
                score += 1; // add 1 point for carrot
                document.getElementById('score').textContent = 'Score: ' + score;
                wolf = { x: cols - 1, y: rows - 1 }; // reset wolf
                document.getElementById('message').textContent = 'Yummy carrot! Wolf sent back! +1 point';
                setTimeout(() => {
                    document.getElementById('message').textContent = '';
                }, 2000);
                drawMaze();
                return;
            }
        }
    }
}

function canMoveTo(tx, ty) {
    if (tx < 0 || tx >= cols || ty < 0 || ty >= rows || maze[ty][tx] === 1) return false;
    if (tx === player.x && ty === player.y) return false; // already there
    if (tx === player.x) { // same column, vertical move
        const start = Math.min(player.y, ty);
        const end = Math.max(player.y, ty);
        for (let i = start; i <= end; i++) {
            if (maze[i][tx] === 1 || (tx === wolf.x && i === wolf.y)) return false;
        }
        return true;
    } else if (ty === player.y) { // same row, horizontal move
        const start = Math.min(player.x, tx);
        const end = Math.max(player.x, tx);
        for (let i = start; i <= end; i++) {
            if (maze[ty][i] === 1 || (i === wolf.x && ty === wolf.y)) return false;
        }
        return true;
    }
    return false; // diagonal not allowed for drag
}

let wolfInterval;

function getNextWolfMove() {
    // Simple BFS to find next step towards the house
    const queue = [{ x: wolf.x, y: wolf.y, path: [] }];
    const visited = new Set();
    visited.add(`${wolf.x},${wolf.y}`);
    
    const directions = [
        { x: 0, y: -1 }, // up
        { x: 1, y: 0 },  // right
        { x: 0, y: 1 },  // down
        { x: -1, y: 0 }  // left
    ];
    
    while (queue.length > 0) {
        const current = queue.shift();
        
        // Check if reached house
        if (current.x === realExit.x && current.y === realExit.y) {
            // Return the first step
            if (current.path.length > 0) {
                return current.path[0];
            }
            return null; // already at house
        }
        
        for (let dir of directions) {
            const nx = current.x + dir.x;
            const ny = current.y + dir.y;
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && maze[ny][nx] === 0 && !visited.has(`${nx},${ny}`)) {
                visited.add(`${nx},${ny}`);
                queue.push({ x: nx, y: ny, path: [...current.path, { x: nx, y: ny }] });
            }
        }
    }
    return null; // no path
}

function moveWolf() {
    const nextMove = getNextWolfMove();
    if (nextMove) {
        wolf.x = nextMove.x;
        wolf.y = nextMove.y;
    }
    drawMaze();
    if (wolf.x === realExit.x && wolf.y === realExit.y) {
        document.getElementById('message').textContent = 'Wolf reached home first! Try again!';
        setTimeout(() => {
            player = { x: 0, y: 0 };
            wolf = { x: cols - 1, y: rows - 1 };
            drawMaze();
            document.getElementById('message').textContent = '';
        }, 2000);
    }
}

mazeContainer.addEventListener('mousedown', (e) => {
    dragging = true;
    if (e.target.tagName === 'TD') {
        let td = e.target;
        let tr = td.parentElement;
        let table = mazeContainer.querySelector('table');
        let y = Array.from(table.rows).indexOf(tr);
        let x = Array.from(tr.cells).indexOf(td);
        if (canMoveTo(x, y)) {
            player.x = x;
            player.y = y;
            drawMaze();
            checkWin();
        }
    }
});

mazeContainer.addEventListener('mousemove', (e) => {
    if (dragging && e.target.tagName === 'TD') {
        let td = e.target;
        let tr = td.parentElement;
        let table = mazeContainer.querySelector('table');
        let y = Array.from(table.rows).indexOf(tr);
        let x = Array.from(tr.cells).indexOf(td);
        if (canMoveTo(x, y)) {
            player.x = x;
            player.y = y;
            drawMaze();
            checkWin();
        }
    }
});

mazeContainer.addEventListener('mouseup', () => {
    dragging = false;
});

mazeContainer.addEventListener('touchstart', (e) => {
    e.preventDefault();
    dragging = true;
    if (e.target.tagName === 'TD') {
        let td = e.target;
        let tr = td.parentElement;
        let table = mazeContainer.querySelector('table');
        let y = Array.from(table.rows).indexOf(tr);
        let x = Array.from(tr.cells).indexOf(td);
        if (canMoveTo(x, y)) {
            player.x = x;
            player.y = y;
            drawMaze();
            checkWin();
        }
    }
});

mazeContainer.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (dragging && e.target.tagName === 'TD') {
        let td = e.target;
        let tr = td.parentElement;
        let table = mazeContainer.querySelector('table');
        let y = Array.from(table.rows).indexOf(tr);
        let x = Array.from(tr.cells).indexOf(td);
        if (canMoveTo(x, y)) {
            player.x = x;
            player.y = y;
            drawMaze();
            checkWin();
        }
    }
});

mazeContainer.addEventListener('touchend', (e) => {
    e.preventDefault();
    dragging = false;
});

document.getElementById('nextLevel').addEventListener('click', () => {
    level++;
    document.getElementById('level').textContent = 'Level: ' + level;
    document.getElementById('message').textContent = '';
    document.getElementById('nextLevel').style.display = 'none';
    clearInterval(wolfInterval);
    setDimensions();
    generateMaze();
    setCarrots();
    player = { x: 0, y: 0 };
    drawMaze();
    wolfInterval = setInterval(moveWolf, 750);
});

// Initial setup
setDimensions();
generateMaze();
if (maze[realExit.y][realExit.x] === 1) {
    maze[realExit.y][realExit.x] = 0;
    // Connect to adjacent path
    const adj = [
        {x: realExit.x, y: realExit.y-1},
        {x: realExit.x+1, y: realExit.y},
        {x: realExit.x, y: realExit.y+1},
        {x: realExit.x-1, y: realExit.y}
    ];
    let connected = false;
    for (let a of adj) {
        if (a.x >= 0 && a.x < cols && a.y >= 0 && a.y < rows && maze[a.y][a.x] === 0) {
            connected = true;
            break;
        }
    }
    if (!connected) {
        for (let a of adj) {
            if (a.x >= 0 && a.x < cols && a.y >= 0 && a.y < rows) {
                maze[a.y][a.x] = 0;
                break;
            }
        }
    setCarrots();
drawMaze();
document.getElementById('score').textContent = 'Score: ' + score;
wolfInterval = setInterval(moveWolf, 750); // wolf moves every 0.75 seconds