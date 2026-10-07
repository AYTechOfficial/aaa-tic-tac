"use client";

import { useState, useEffect, useCallback } from 'react';

// Constants for winning lines
const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

// Theme definitions
const THEME_COLORS = {
  dark: {
    'bg-primary': 'bg-[#1A1A2E]',
    'bg-secondary': 'bg-[#2E2E4A]',
    'text-general': 'text-[#E0E0E0]',
    'player-x': 'text-[#E94560]',
    'player-o': 'text-[#00B894]',
    'button-hover': 'hover:bg-[#533483]',
    'winning-line': 'bg-[#FFD700]',
    'border-color': 'border-[#533483]',
    'shadow-color': 'shadow-[#533483]/50',
  },
  classic: {
    'bg-primary': 'bg-gray-100',
    'bg-secondary': 'bg-white',
    'text-general': 'text-gray-800',
    'player-x': 'text-red-600',
    'player-o': 'text-blue-600',
    'button-hover': 'hover:bg-gray-200',
    'winning-line': 'bg-yellow-400',
    'border-color': 'border-gray-400',
    'shadow-color': 'shadow-gray-400/50',
  },
  'sci-fi': {
    'bg-primary': 'bg-[#0A0A1A]',
    'bg-secondary': 'bg-[#1F0F3F]',
    'text-general': 'text-[#00FFFF]',
    'player-x': 'text-[#FF00FF]',
    'player-o': 'text-[#00FF00]',
    'button-hover': 'hover:bg-[#3F0F7F]',
    'winning-line': 'bg-[#FFFF00]',
    'border-color': 'border-[#00FFFF]',
    'shadow-color': 'shadow-[#00FFFF]/50',
  }
};

type Player = 'X' | 'O';
type Board = (Player | '')[];
type GameMode = 'AI' | 'Local';
type Winner = Player | 'Draw' | null;
type ThemeName = keyof typeof THEME_COLORS;

export default function HomePage() {
  const [board, setBoard] = useState<Board>(Array(9).fill(''));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Winner>(null);
  const [mode, setMode] = useState<GameMode | null>(null);
  const [showThemes, setShowThemes] = useState(false);
  const [theme, setTheme] = useState<ThemeName>('dark');
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  // Load theme from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem('aaa-tictactoe-theme');
    if (storedTheme && THEME_COLORS[storedTheme as ThemeName]) {
      setTheme(storedTheme as ThemeName);
    }
  }, []);

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('aaa-tictactoe-theme', theme);
  }, [theme]);

  const currentTheme = THEME_COLORS[theme];

  const checkWinner = useCallback((currentBoard: Board) => {
    for (let i = 0; i < WINNING_LINES.length; i++) {
      const [a, b, c] = WINNING_LINES[i];
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { player: currentBoard[a] as Player, line: WINNING_LINES[i] };
      }
    }
    return null;
  }, []);

  const checkDraw = useCallback((currentBoard: Board) => {
    return !checkWinner(currentBoard) && currentBoard.every(cell => cell !== '');
  }, [checkWinner]);

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(''));
    setCurrentPlayer('X');
    setWinner(null);
    setWinningLine(null);
  }, []);

  const startGame = useCallback((selectedMode: GameMode) => {
    setMode(selectedMode);
    resetGame();
  }, [resetGame]);

  const handleThemeChange = useCallback((newTheme: ThemeName) => {
    setTheme(newTheme);
    setShowThemes(false);
  }, []);

  const aiMove = useCallback((currentBoard: Board, player: Player) => {
    const emptyCells = currentBoard.map((cell, index) => cell === '' ? index : -1).filter(index => index !== -1);

    if (emptyCells.length === 0) return;

    // Helper to check if a move leads to a win/block
    const findStrategicMove = (boardState: Board, targetPlayer: Player) => {
      for (const index of emptyCells) {
        const testBoard = [...boardState];
        testBoard[index] = targetPlayer;
        if (checkWinner(testBoard)?.player === targetPlayer) {
          return index;
        }
      }
      return null;
    };

    // 1. Check for AI win
    let move = findStrategicMove(currentBoard, 'O');
    if (move !== null) {
      return move;
    }

    // 2. Block player win
    move = findStrategicMove(currentBoard, 'X');
    if (move !== null) {
      return move;
    }

    // 3. Take center
    if (currentBoard[4] === '') {
      return 4;
    }

    // 4. Take opposite corner if player has one
    const corners = [0, 2, 6, 8];
    for (let i = 0; i < corners.length; i++) {
      const corner = corners[i];
      const oppositeCorner = corners[3 - i]; // 0->8, 2->6, 6->2, 8->0
      if (currentBoard[corner] === 'X' && currentBoard[oppositeCorner] === '') {
        return oppositeCorner;
      }
    }

    // 5. Take any empty corner
    const availableCorners = corners.filter(c => currentBoard[c] === '');
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // 6. Take any empty side
    const sides = [1, 3, 5, 7];
    const availableSides = sides.filter(s => currentBoard[s] === '');
    if (availableSides.length > 0) {
      return availableSides[Math.floor(Math.random() * availableSides.length)];
    }

    // Fallback: random move
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }, [checkWinner]);


  const handleCellClick = useCallback((index: number) => {
    if (winner || board[index] !== '' || (mode === 'AI' && currentPlayer === 'O')) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const winnerInfo = checkWinner(newBoard);
    if (winnerInfo) {
      setWinner(winnerInfo.player);
      setWinningLine(winnerInfo.line);
      return;
    }

    if (checkDraw(newBoard)) {
      setWinner('Draw');
      return;
    }

    const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';
    setCurrentPlayer(nextPlayer);

    if (mode === 'AI' && nextPlayer === 'O') {
      setTimeout(() => {
        const aiChosenMove = aiMove(newBoard, 'O');
        if (aiChosenMove !== undefined) { // Ensure AI found a move
          const aiBoard = [...newBoard];
          aiBoard[aiChosenMove] = 'O';
          setBoard(aiBoard);

          const aiWinnerInfo = checkWinner(aiBoard);
          if (aiWinnerInfo) {
            setWinner(aiWinnerInfo.player);
            setWinningLine(aiWinnerInfo.line);
            return;
          }

          if (checkDraw(aiBoard)) {
            setWinner('Draw');
            return;
          }
          setCurrentPlayer('X'); // Switch back to player X
        }
      }, 1000); // AI moves within 1 second
    }
  }, [board, currentPlayer, winner, mode, checkWinner, checkDraw, aiMove]);

  const getStatusMessage = () => {
    if (winner === 'Draw') {
      return 'Draw!';
    }
    if (winner) {
      return `Player ${winner} Wins!`;
    }
    return `Current Player: ${currentPlayer}`;
  };

  const renderCell = (index: number) => {
    const isWinningCell = winningLine && winningLine.includes(index);
    return (
      <button
        key={index}
        className={`
          w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32
          flex items-center justify-center text-5xl font-bold
          ${currentTheme['bg-secondary']} ${currentTheme['text-general']}
          border-2 ${currentTheme['border-color']} rounded-lg
          transition-all duration-200 ease-in-out
          ${board[index] === '' && !winner ? `hover:scale-105 active:scale-95 ${currentTheme['button-hover']}` : ''}
          ${board[index] === 'X' ? currentTheme['player-x'] : ''}
          ${board[index] === 'O' ? currentTheme['player-o'] : ''}
          ${isWinningCell ? `${currentTheme['winning-line']} !text-black` : ''}
        `}
        onClick={() => handleCellClick(index)}
        disabled={!!winner || board[index] !== '' || (mode === 'AI' && currentPlayer === 'O')}
        aria-label={`Cell ${index + 1}`}
      >
        {board[index]}
      </button>
    );
  };

  return (
    <main className={`
      min-h-screen flex flex-col items-center justify-center p-4
      ${currentTheme['bg-primary']} ${currentTheme['text-general']}
      font-inter
    `}>
      <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-8 text-center tracking-tight">
        AAA Tic Tac Toe
      </h1>

      {showThemes ? (
        <div className={`
          ${currentTheme['bg-secondary']} p-8 rounded-xl shadow-lg ${currentTheme['shadow-color']}
          flex flex-col gap-4 items-center w-full max-w-md
        `}>
          <h2 className="text-3xl font-bold mb-4">Select Theme</h2>
          {Object.keys(THEME_COLORS).map((t) => (
            <button
              key={t}
              className={`
                w-full py-3 px-6 rounded-lg text-xl font-semibold
                ${currentTheme['bg-primary']} ${currentTheme['text-general']}
                transition-all duration-200 ease-in-out
                ${currentTheme['button-hover']}
                ${theme === t ? `ring-4 ${currentTheme['border-color']} scale-105` : ''}
              `}
              onClick={() => handleThemeChange(t as ThemeName)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button
            className={`
              mt-4 w-full py-3 px-6 rounded-lg text-xl font-semibold
              ${currentTheme['bg-primary']} ${currentTheme['text-general']}
              transition-all duration-200 ease-in-out
              ${currentTheme['button-hover']}
            `}
            onClick={() => setShowThemes(false)}
          >
            Back
          </button>
        </div>
      ) : (
        <>
          {mode === null ? (
            // Initial Menu State
            <div className={`
              ${currentTheme['bg-secondary']} p-8 rounded-xl shadow-lg ${currentTheme['shadow-color']}
              flex flex-col gap-4 items-center w-full max-w-md
            `}>
              <button
                className={`
                  w-full py-3 px-6 rounded-lg text-xl font-semibold
                  ${currentTheme['bg-primary']} ${currentTheme['text-general']}
                  transition-all duration-200 ease-in-out
                  ${currentTheme['button-hover']}
                `}
                onClick={() => startGame('AI')}
              >
                Play vs AI
              </button>
              <button
                className={`
                  w-full py-3 px-6 rounded-lg text-xl font-semibold
                  ${currentTheme['bg-primary']} ${currentTheme['text-general']}
                  transition-all duration-200 ease-in-out
                  ${currentTheme['button-hover']}
                `}
                onClick={() => startGame('Local')}
              >
                Play Local Multiplayer
              </button>
              <button
                className={`
                  mt-4 w-full py-3 px-6 rounded-lg text-xl font-semibold
                  ${currentTheme['bg-primary']} ${currentTheme['text-general']}
                  transition-all duration-200 ease-in-out
                  ${currentTheme['button-hover']}
                `}
                onClick={() => setShowThemes(true)}
              >
                Themes
              </button>
            </div>
          ) : (
            // Game Board State
            <div className={`
              ${currentTheme['bg-secondary']} p-8 rounded-xl shadow-lg ${currentTheme['shadow-color']}
              flex flex-col gap-8 items-center
            `}>
              <div className="text-3xl sm:text-4xl font-bold text-center">
                {getStatusMessage()}
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {board.map((_, index) => renderCell(index))}
              </div>
              {(winner || checkDraw(board)) && (
                <button
                  className={`
                    py-3 px-8 rounded-lg text-xl font-semibold
                    ${currentTheme['bg-primary']} ${currentTheme['text-general']}
                    transition-all duration-200 ease-in-out
                    ${currentTheme['button-hover']}
                  `}
                  onClick={() => startGame(mode)} // Restart with current mode
                >
                  New Game
                </button>
              )}
              <button
                className={`
                  py-2 px-6 rounded-lg text-lg font-semibold
                  ${currentTheme['bg-primary']} ${currentTheme['text-general']}
                  transition-all duration-200 ease-in-out
                  ${currentTheme['button-hover']}
                `}
                onClick={() => setMode(null)} // Go back to main menu
              >
                Main Menu
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
