const socket = io();

const chess = new Chess();
const bordElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
  const board = chess.board();
  bordElement.innerHTML = "";
  board.forEach((row, rowIndex) => {
    row.forEach((squre, squreIndex) => {
      let squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowIndex + squreIndex) % 2 === 0 ? "light" : "dark"
      );
      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = squreIndex;
      if (squre) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          squre.color === "w" ? "white" : "black"
        );
        pieceElement.innerText = getPieceUnicode(squre);
        pieceElement.draggable = playerRole === squre.color;
        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squreIndex };
            e.dataTransfer.setData("text/plain", "");
          }
        });
        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
        });
        squareElement.appendChild(pieceElement);
      }
      squareElement.addEventListener("dragover", function (e) {
        e.preventDefault();
      });
      squareElement.addEventListener("drop", function (e) {
        e.preventDefault();
        if (draggedPiece) {
          const targetSource = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };
          handleMove(sourceSquare, targetSource);
        }
      });
      bordElement.appendChild(squareElement);
    });
  });
  if (playerRole === "b") {
    bordElement.classList.add("flipped");
  } else {
    bordElement.classList.remove("flipped");
  }
};

const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
  };
  // Check if the move is a promotion (pawn reaches the last rank)
  const isPromotion =
    (chess.turn() === "w" && source.row === 1 && target.row === 0) ||
    (chess.turn() === "b" && source.row === 6 && target.row === 7);

  if (isPromotion) {
    move.promotion = "q"; // Default to queen, or ask player for their choice
  }
  socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
  const unicodePices = {
    p: "♟",
    r: "♜",
    n: "♞",
    b: "♝",
    q: "♛",
    k: "♚",
    P: "♙",
    R: "♖",
    N: "♘",
    B: "♗",
    Q: "♕",
    K: "♔",
  };
  return unicodePices[piece.type] || "";
};

socket.on("playerRole", function (role) {
  playerRole = role;
  renderBoard();
});
socket.on("spectetorRole", function () {
  playerRole = null;
  renderBoard();
});
socket.on("boardState", function (fen) {
  chess.load(fen);
  renderBoard();
});
socket.on("move", function (move) {
  chess.move(move);
  renderBoard();
});



renderBoard();
