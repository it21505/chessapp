var board = null;
var game = new Chess();
var whiteSquareGrey = '#a9a9a9';
var blackSquareGrey = '#696969';

/*
The libraries that we used are :

- chessboard.js : handles creating the visuals (the chess board and pieces),
as well as the interface for when a user makes a move (dragging pieces to a square).

- chess.js : is a library which is used for chess move generation/validation, piece placement/movement,
and check/checkmate/stalemate detection – basically everything but the AI.

 */

//---------------- ΑΙ Code Starts Here ---------------

//Function that calculates the value of the current pawn depending on its color.
//Based on this article : https://en.wikipedia.org/wiki/Chess_piece_relative_value

var getPieceValue = function (piece) {
    if (piece === null) {
        return 0;
    }
    var getAbsoluteValue = function (piece) {
        if (piece.type === 'p') {
            return 10;
        } else if (piece.type === 'r') {
            return 50;
        } else if (piece.type === 'n') {
            return 30;
        } else if (piece.type === 'b') {
            return 30 ;
        } else if (piece.type === 'q') {
            return 90;
        } else if (piece.type === 'k') {
            return 900;
        }
        throw "Unknown piece type: " + piece.type;
    };

    var absoluteValue = getAbsoluteValue(piece, piece.color === 'w');
    return piece.color === 'w' ? absoluteValue : -absoluteValue;
};

//Function that evaluates the board ( the value of all the pawns on the board )
var evaluateBoard = function(board) {
    var totalEvaluation = 0;
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            totalEvaluation = totalEvaluation + getPieceValue(board[i][j]);
        }
    }
    return totalEvaluation;
};

//Makes a random Move -- Not used
function makeRandomMove () {
    var possibleMoves = game.moves();

    // game over
    if (possibleMoves.length === 0) return;

    var randomIdx = Math.floor(Math.random() * possibleMoves.length)
    game.move(possibleMoves[randomIdx]);
    board.position(game.fen())

}

//Calculate Best Move with Depth One ( No Min Max ) -- Not used
function makeBestMove(){

    var possibleMoves = game.moves();

    possibleMoves.sort(function(a, b){return 0.5 - Math.random()});

    // game over
    if (possibleMoves.length === 0) return;

    var bestMove = null;
    var bestMoveValue = Number.MAX_VALUE;
    possibleMoves.forEach(function(move) {
        game.move(move);
        var currentValue = evaluateBoard(game.board());
        if(currentValue < bestMoveValue){
            bestMove = move;
            bestMoveValue = currentValue;
        }
        game.undo();
    });
    game.move(bestMove);
    board.position(game.fen());
}

//Function that calculates the best move for each of the pawns.
var minimaxRoot =function(depth, game, isMaximisingPlayer) {

    var newGameMoves = game.moves();
    var bestMove = -9999;
    var bestMoveFound;

    for(var i = 0; i < newGameMoves.length; i++) {
        var newGameMove = newGameMoves[i];
        game.move(newGameMove);
        var value = minimax(depth - 1, game, -10000, 10000, !isMaximisingPlayer);
        game.undo();
        if(value >= bestMove) {
            bestMove = value;
            bestMoveFound = newGameMove;
        }
    }
    return bestMoveFound;
};

//Function that implements Min-Max algorithm with Alpha-Beta pruning that calculates the best move with the given depth.
var minimax = function (depth, game, alpha, beta, isMaximisingPlayer) {
    if (depth === 0) {
        return -evaluateBoard(game.board());
    }

    var newGameMoves = game.moves();

    if (isMaximisingPlayer) {
        var bestMove = -9999;
        for (var i = 0; i < newGameMoves.length; i++) {
            game.move(newGameMoves[i]);
            bestMove = Math.max(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
            game.undo();
            alpha = Math.max(alpha, bestMove);
            if (beta <= alpha) {
                return bestMove;
            }
        }
        return bestMove;
    } else {
        var bestMove = 9999;
        for (var i = 0; i < newGameMoves.length; i++) {
            game.move(newGameMoves[i]);
            bestMove = Math.min(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
            game.undo();
            beta = Math.min(beta, bestMove);
            if (beta <= alpha) {
                return bestMove;
            }
        }
        return bestMove;
    }
};

function makeMove(){
  var bestMove = minimaxRoot(2,game,true);
    game.move(bestMove);
    board.position(game.fen());
}

//-------------- End of AI Code --------------

function removeGreySquares () {
    $('#board .square-55d63').css('background', '')
}

function greySquare (square) {
    var $square = $('#board .square-' + square);

    var background = whiteSquareGrey;
    if ($square.hasClass('black-3c85d')) {
        background = blackSquareGrey
    }

    $square.css('background', background)
}

function onDragStart (source, piece) {
    // do not pick up pieces if the game is over
    if (game.game_over()) return false;

    // or if it's not that side's turn
    if ((game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false
    }

}

//Function that is triggered when we drop the pawn.
function onDrop (source, target) {
    removeGreySquares();

    // see if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });

    // illegal move
    if (move === null) return 'snapback';

    console.log(evaluateBoard(game.board()));

    window.setTimeout(makeMove, 250)
}

function onMouseoverSquare (square, piece) {
    // get list of possible moves for this square
    var moves = game.moves({
        square: square,
        verbose: true
    });

    // exit if there are no moves available for this square
    if (moves.length === 0) return ;

    // highlight the square they moused over
    greySquare(square);

    // highlight the possible squares for this piece
    for (var i = 0; i < moves.length; i++) {
        greySquare(moves[i].to)
    }
}

function onMouseoutSquare (square, piece) {
    removeGreySquares()
}

function onSnapEnd () {
    board.position(game.fen())
}

var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onSnapEnd: onSnapEnd
}

board = Chessboard('board', config);
