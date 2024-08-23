const chessboard = document.getElementById('chessboard');
const letters = 'ABCDEFGH';
const squares = [];
let selectedSquare = null;
let currentPlayer = 'player1';
let moveCount = 1;

const pieces = {
    pawn: '♟',
    rook: '♜',
    knight: '♞',
    bishop: '♝',
    queen: '♛',
    king: '♚',
    archer: 'A',
};

const initialPositions = {
    player1: {
        rook: ['A1', 'H1'],
        knight: ['B1', 'G1'],
        bishop: ['C1', 'F1'],
        queen: ['D1'],
        king: ['E1'],
        archer: ['C1'],  // Player 1's Archer (White)
        pawns: ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2']
    },
    player2: {
        rook: ['A8', 'H8'],
        knight: ['B8', 'G8'],
        bishop: ['C8', 'F8'],
        queen: ['D8'],
        king: ['E8'],
        archer: ['C8'],  // Player 2's Archer (Black)
        pawns: ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7']
    }
};

let archerMoves = {
    player1: 'bishop',
    player2: 'bishop'
};

let aPieceCounts = {
    player1: 0,
    player2: 0
};

function createBoard() {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((i + j) % 2 === 0 ? 'white' : 'black');
            square.dataset.position = letters[j] + (8 - i);
            chessboard.appendChild(square);
            squares.push(square);
        }
    }
}

function placePieces() {
    for (let piece in initialPositions.player1) {
        initialPositions.player1[piece].forEach(position => {
            const square = squares.find(sq => sq.dataset.position === position);
            square.innerText = pieces[piece === 'pawns' ? 'pawn' : piece];
            square.classList.add('player1', 'whitePiece');
        });
    }

    for (let piece in initialPositions.player2) {
        initialPositions.player2[piece].forEach(position => {
            const square = squares.find(sq => sq.dataset.position === position);
            square.innerText = pieces[piece === 'pawns' ? 'pawn' : piece];
            square.classList.add('player2', 'blackPiece');
        });
    }
}

function handleSquareClick(event) {
    const square = event.target;

    if (!square.classList.contains('square')) return;

    if (selectedSquare) {
        movePiece(square);
    } else {
        selectPiece(square);
    }
}

function selectPiece(square) {
    if (square.classList.contains(currentPlayer)) {
        selectedSquare = square;
        highlightMoves(getPossibleMoves(square.dataset.position, square.innerText));
    }
}

function movePiece(targetSquare) {
    if (targetSquare.classList.contains('highlight')) {
        const pieceType = selectedSquare.innerText;

        // Capture and remove the opponent's piece if present
        if (!isSquareEmpty(targetSquare.dataset.position)) {
            const opponentClass = currentPlayer === 'player1' ? 'player2' : 'player1';
            targetSquare.classList.remove(opponentClass, 'whitePiece', 'blackPiece');
            targetSquare.innerText = ''; // Remove the opponent's piece
        }

        // Place the moving piece in the target square
        targetSquare.innerText = pieceType;
        targetSquare.classList.add(currentPlayer, currentPlayer === 'player1' ? 'whitePiece' : 'blackPiece');

        // Clear the previous square
        selectedSquare.innerText = '';
        selectedSquare.classList.remove(currentPlayer, 'whitePiece', 'blackPiece');

        // Handle Archer piece movement
        if (pieceType === pieces.archer) {
            archerMoves[currentPlayer] = archerMoves[currentPlayer] === 'bishop' ? 'rook' : 'bishop';
        }
        if(isGameOver())
        {
            alert(`${currentPlayer === 'player1' ? 'White' : 'Black'} wins!`);
            chessboard.removeEventListener('click', handleSquareClick);
        }
        // Check if the move results in game over
        if (pieceType === pieces.king && isGameOver()) {
            alert(`${currentPlayer === 'player1' ? 'White' : 'Black'} wins!`);
            chessboard.removeEventListener('click', handleSquareClick);
        }

        // Switch turns
        changeTurn();
    }

    clearHighlights();
    selectedSquare = null;
}


function isGameOver() {
    const kings = {
        player1: squares.some(sq => sq.innerText === pieces.king && sq.classList.contains('player1')),
        player2: squares.some(sq => sq.innerText === pieces.king && sq.classList.contains('player2'))
    };
    
    return !kings.player1 || !kings.player2;  // Game ends if only one king is left
}


function changeTurn() {
    currentPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
    moveCount++;
}

function getPossibleMoves(position, piece) {
    const moves = [];
    const [col, row] = [position.charCodeAt(0), parseInt(position[1])];

    if (piece === pieces.pawn) {
        const direction = currentPlayer === 'player1' ? 1 : -1;
        const newRow = row + direction;
        if (isValidPosition(col, newRow)) {
            moves.push(String.fromCharCode(col) + newRow);
            // Add diagonal capture moves
            const diagonalMoves = [
                {x: col - 1, y: newRow},
                {x: col + 1, y: newRow}
            ];
            diagonalMoves.forEach(move => {
                if (isValidPosition(move.x, move.y) && isOpponentPiece(String.fromCharCode(move.x) + move.y, piece)) {
                    moves.push(String.fromCharCode(move.x) + move.y);
                }
            });
        }
    }

    if (piece === pieces.rook || (piece === pieces.archer && archerMoves[currentPlayer] === 'rook')) {
        moves.push(...getLinearMoves(col, row, [[1, 0], [-1, 0], [0, 1], [0, -1]]));
    }

    if (piece === pieces.bishop || (piece === pieces.archer && archerMoves[currentPlayer] === 'bishop')) {
        moves.push(...getLinearMoves(col, row, [[1, 1], [-1, 1], [1, -1], [-1, -1]]));
    }

    if (piece === pieces.knight) {
        const knightMoves = [
            [1, 2], [1, -2], [-1, 2], [-1, -2],
            [2, 1], [2, -1], [-2, 1], [-2, -1]
        ];

        knightMoves.forEach(([dx, dy]) => {
            const newCol = col + dx;
            const newRow = row + dy;
            if (isValidPosition(newCol, newRow)) {
                moves.push(String.fromCharCode(newCol) + newRow);
            }
        });
    }

    if (piece === pieces.queen) {
        moves.push(...getPossibleMoves(position, pieces.rook));
        moves.push(...getPossibleMoves(position, pieces.bishop));
    }

    if (piece === pieces.king) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (isValidPosition(col + i, row + j)) {
                    moves.push(String.fromCharCode(col + i) + (row + j));
                }
            }
        }
    }

    return moves.filter(move => isSquareEmptyOrOpponent(move));
}

function getLinearMoves(col, row, directions) {
    const moves = [];
    directions.forEach(([dx, dy]) => {
        for (let i = 1; i < 8; i++) {
            const newCol = col + dx * i;
            const newRow = row + dy * i;
            if (!isValidPosition(newCol, newRow)) break;
            const position = String.fromCharCode(newCol) + newRow;
            if (isSquareEmptyOrOpponent(position)) {
                moves.push(position);
                if (!isSquareEmpty(position)) break;
            } else {
                break;
            }
        }
    });
    return moves;
}

function isSquareEmptyOrOpponent(position) {
    const square = squares.find(sq => sq.dataset.position === position);
    return !square.innerText || square.classList.contains(currentPlayer === 'player1' ? 'player2' : 'player1');
}

function isSquareEmpty(position) {
    const square = squares.find(sq => sq.dataset.position === position);
    return !square.innerText;
}

function isValidPosition(col, row) {
    return col >= 'A'.charCodeAt(0) && col <= 'H'.charCodeAt(0) && row >= 1 && row <= 8;
}

function isOpponentPiece(position, piece) {
    const square = squares.find(sq => sq.dataset.position === position);
    if (!square || !square.innerText) return false;  // Return false if the cell is empty

    // Determine if the piece belongs to the opponent
    const isCurrentPlayerPiece = square.classList.contains(currentPlayer);
    
    return !isCurrentPlayerPiece;
}

function highlightMoves(moves) {
    moves.forEach(move => {
        const square = squares.find(sq => sq.dataset.position === move);
        if (square) square.classList.add('highlight');
    });
}

function clearHighlights() {
    squares.forEach(square => square.classList.remove('highlight'));
}

createBoard();
placePieces();
chessboard.addEventListener('click', handleSquareClick);
