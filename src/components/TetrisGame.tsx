import React, { useState, useEffect, useCallback } from 'react';
import './TetrisGame.css';

type Piece = {
  shape: number[][];
  color: string;
  position: { x: number; y: number };
};

const TETROMINOES = [
  { shape: [[1, 1, 1, 1]], color: 'cyan' },    // I
  { shape: [[1, 1], [1, 1]], color: 'yellow' }, // O
  { shape: [[0, 1, 0], [1, 1, 1]], color: 'purple' }, // T
  { shape: [[0, 1, 1], [1, 1, 0]], color: 'green' },  // S
  { shape: [[1, 1, 0], [0, 1, 1]], color: 'red' },     // Z
  { shape: [[1, 0, 0], [1, 1, 1]], color: 'blue' },    // J
  { shape: [[0, 0, 1], [1, 1, 1]], color: 'orange' }   // L
];

const TetrisGame = () => {
  const [board, setBoard] = useState(Array(20).fill(Array(10).fill(0)));
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameTime, setGameTime] = useState(0);

  const createNewPiece = useCallback((currentBoard: (string | number)[][]) => {
    const randomIndex = Math.floor(Math.random() * TETROMINOES.length);
    const newPiece = {
      ...TETROMINOES[randomIndex],
      position: { x: Math.floor(5 - TETROMINOES[randomIndex].shape[0].length/2), y: 0 }
    };

    if (newPiece.position.x < 0 ||
        newPiece.position.x + newPiece.shape[0].length > 10 ||
        checkCollision(newPiece.position.x, newPiece.position.y, newPiece.shape, currentBoard)) {
      setGameOver(true);
      setIsPlaying(false);
      return null;
    }

    setCurrentPiece(newPiece);
    return newPiece;
  }, []);

  const startGame = useCallback(() => {
    const newBoard = Array.from({length: 20}, () => Array(10).fill(0));
    setBoard(newBoard);
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    setGameTime(0);
    createNewPiece(newBoard);
  }, [createNewPiece]);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const checkCollision = (
    newX: number,
    newY: number,
    shape: number[][],
    currentBoard = board // 添加可選參數使用當前棋盤狀態
  ) => {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] !== 0) {
          const boardX = newX + x;
          const boardY = newY + y;
          if (
            boardX < 0 ||
            boardX >= 10 ||
            boardY >= 20 ||
            (boardY >= 0 && currentBoard[boardY][boardX] !== 0)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const mergePieceToBoard = () => {
    if (!currentPiece) return;

    const newBoard = board.map(row => [...row]);
    currentPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          newBoard[currentPiece.position.y + y][currentPiece.position.x + x] =
            currentPiece.color;
        }
      });
    });
    setBoard(newBoard);
    checkCompleteLines(newBoard);

    const nextPiece = createNewPiece(newBoard);
    if (!nextPiece) return;
  };

  const checkCompleteLines = (board: (string | number)[][]) => {
    let linesCleared = 0;
    const newBoard = board.filter(row => {
      const isFull = row.every(cell => cell !== 0);
      if (isFull) linesCleared++;
      return !isFull;
    });

    if (linesCleared > 0) {
      setScore(prev => prev + (linesCleared * 100));
      setBoard([
        ...Array.from({length: linesCleared}, () => Array(10).fill(0)),
        ...newBoard
      ]);
    }
  };

  const moveDown = () => {
    if (!currentPiece) return;

    if (!checkCollision(currentPiece.position.x, currentPiece.position.y + 1, currentPiece.shape)) {
      setCurrentPiece(prev => ({
        ...prev!,
        position: { ...prev!.position, y: prev!.position.y + 1 }
      }));
    } else {
      mergePieceToBoard();
      createNewPiece(board);
    }
  };

  const moveHorizontal = (direction: number) => {
    if (!currentPiece) return;

    const newX = currentPiece.position.x + direction;
    if (!checkCollision(newX, currentPiece.position.y, currentPiece.shape)) {
      setCurrentPiece(prev => ({
        ...prev!,
        position: { ...prev!.position, x: newX }
      }));
    }
  };

  const rotatePiece = () => {
    if (!currentPiece) return;

    const rotated = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map(row => row[i]).reverse()
    );

    if (!checkCollision(currentPiece.position.x, currentPiece.position.y, rotated)) {
      setCurrentPiece(prev => ({
        ...prev!,
        shape: rotated
      }));
    }
  };

  const handleHardDrop = useCallback(() => {
    if (!currentPiece || gameOver || !isPlaying) return;

    const tempBoard = board.map(row => [...row]);
    let dropDistance = 0;

    while (!checkCollision(
      currentPiece.position.x,
      currentPiece.position.y + dropDistance + 1,
      currentPiece.shape,
      tempBoard
    )) {
      dropDistance++;
    }

    if (dropDistance > 0) {
      currentPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            const boardY = currentPiece.position.y + dropDistance + y;
            const boardX = currentPiece.position.x + x;
            if (boardY >= 0 && boardY < 20) {
              tempBoard[boardY][boardX] = currentPiece.color;
            }
          }
        });
      });

      setScore(prev => prev + dropDistance * 2);
      setBoard(tempBoard);
      checkCompleteLines(tempBoard);

      const nextPiece = createNewPiece(tempBoard);
      if (!nextPiece) return;
      setCurrentPiece(nextPiece);
    }
  }, [currentPiece, gameOver, board, isPlaying, createNewPiece]);

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);

    if (currentPiece && isPlaying) {
      currentPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            const boardY = currentPiece.position.y + y;
            const boardX = currentPiece.position.x + x;
            if (boardY >= 0 && boardY < 20 && boardX >= 0 && boardX < 10) {
              displayBoard[boardY][boardX] = currentPiece.color;
            }
          }
        });
      });
    }

    return displayBoard.map((row, y) => (
      <div key={y} className="row">
        {row.map((cell, x) => (
          <div
            key={x}
            className="cell"
            style={{ backgroundColor: cell || 'transparent' }}
          />
        ))}
      </div>
    ));
  };

  useEffect(() => {
    if (isPlaying && !isPaused) {
      const timer = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPlaying, isPaused]);

  useEffect(() => {
    if (!isPlaying || gameOver || isPaused) return;

    const dropInterval = Math.max(800 - Math.floor(gameTime / 30) * 100, 200);
    const gameLoop = setInterval(moveDown, dropInterval);
    return () => clearInterval(gameLoop);
  }, [currentPiece, isPlaying, gameOver, isPaused, gameTime]);

  useEffect(() => {
    if (gameOver) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft': moveHorizontal(-1); break;
        case 'ArrowRight': moveHorizontal(1); break;
        case 'ArrowDown': moveDown(); break;
        case 'ArrowUp': rotatePiece(); break;
        case ' ': handleHardDrop(); break;
        case 'p':
        case 'P':
          if (isPlaying && !gameOver) togglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPiece, gameOver, handleHardDrop, isPaused, togglePause]);

  useEffect(() => {
    createNewPiece(board);
  }, []);

  return (
    <div className="tetris-container">
      <div className="game-container">
        <div className="score-board">
          <div className="score-card">
            <span className="score-label">SCORE</span>
            <span className="score-value">{score}</span>
          </div>
          {!isPlaying && (
            <button onClick={startGame} className="start-button neon-button">
              {gameOver ? 'Play Again' : 'Start Game'}
            </button>
          )}
          {isPlaying && (
            <button onClick={togglePause} className="pause-button neon-button">
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          )}
        </div>

        <div className="board-container">
          <div className="board-frame">
            <div className="board">{renderBoard()}</div>
          </div>
          {gameOver && <div className="game-over">GAME OVER</div>}
        </div>

        <div className="controls-tip">
          <div className="control-item">
            <kbd>←→</kbd> Move
          </div>
          <div className="control-item">
            <kbd>↑</kbd> Rotate
          </div>
          <div className="control-item">
            <kbd>↓</kbd> Speed Up
          </div>
          <div className="control-item">
            <kbd>Space</kbd> Hard Drop
          </div>
          <div className="control-item">
            <kbd>P</kbd> Pause
          </div>
        </div>
      </div>
    </div>
  );
};

export default TetrisGame;
