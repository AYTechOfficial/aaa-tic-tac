'use client';

import { useState, useEffect } from 'react';

// Define theme colors and properties
const THEMES: Record<string, {
  primary: string;
  secondary: string;
  x: string;
  o: string;
  text: string;
  hover: string;
  winning: string;
}> = {
  dark: {
    primary: '#1A1A2E',
    secondary: '#2E2E4A',
    x: '#E94560',
    o: '#00B894',
    text: '#E0E0E0',
    hover: '#533483',
    winning: '#FFD700',
  },
  classic: {
    primary: '#F0F0F0',
    secondary: '#FFFFFF',
    x: '#3F51B5',
    o: '#FFC107',
    text: '#333333',
    hover: '#E0E0E0',
    winning: '#4CAF50',
  },
  'sci-fi': {
    primary: '#0A0A1A',
    secondary: '#1A1A3A',
    x: '#00FFFF',
    o: '#FF00FF',
    text: '#00FF00',
    hover: '#330033',
    winning: '#FFFF00',
  },
};

// Game state interface
interface GameState {
  board: string[];
  currentPlayer: 'X' | 'O';
  winner: { player: 'X' | 'O' | 'Draw'; line: number[] | null } | null;
  mode: 'AI' | 'Local' | null;
  theme: string;
}

// Initial game state for a fresh load (menu state)
const initialGameState: GameState = {
  board: Array(9).fill(''),
  currentPlayer: 'X',
  winner: null,
  mode: null,
  theme: 'dark', // Default theme
};

// Function to calculate winner and winning line
function calculateWinner(board: string[]): { player: 'X' | 'O' | 'Draw'; line: number[] } | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { player: board[a] as 'X' | 'O', line: lines[i] };
    }
  }

  if (board.every(cell => cell !== '')) {
    return { player: 'Draw', line: null };
  }

  return null;
}

// Simple AI move logic (random empty cell)
const getAIMove = (board: string[]): number => {
  const emptyCells = board.map((cell, i) => (cell === '' ? i : -1)).filter(i => i !== -1);
  if (emptyCells.length === 0) {
    return -1; // No move possible
  }
  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  return emptyCells[randomIndex];
};

export default function HomePage() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [showThemes, setShowThemes] = useState(false);

  // Effect to load theme from localStorage on initial mount
  useEffect(() => {
    const storedTheme = localStorage.getItem('ticTacToeTheme');
    if (storedTheme && THEMES[storedTheme]) {
      setGameState(prev => ({ ...prev, theme: storedTheme }));
    } else {
      setGameState(prev => ({ ...prev, theme: 'dark' })); // Default theme if none stored or invalid
    }
  }, []);

  // Effect to save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ticTacToeTheme', gameState.theme);
  }, [gameState.theme]);

  const handleCellClick = (i: number) => {
    if (gameState.winner || gameState.board[i] !== '') {
      return;
    }

    const newBoard = [...gameState.board];
    newBoard[i] = gameState.currentPlayer;

    const newWinner = calculateWinner(newBoard);
    const newPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: newPlayer,
      winner: newWinner,
    }));

    // AI's turn if in AI mode and no winner yet
    if (gameState.mode === 'AI' && newPlayer === 'O' && !newWinner) {
      setTimeout(() => {
        const aiMoveIndex = getAIMove(newBoard);
        if (aiMoveIndex !== -1) {
          const aiBoard = [...newBoard];
          aiBoard[aiMoveIndex] = 'O';
          const aiWinner = calculateWinner(aiBoard);
          setGameState(prev => ({
            ...prev,
            board: aiBoard,
            currentPlayer: 'X',
            winner: aiWinner,
          }));
        }
      }, 1000);
    }
  };

  const handleNewGame = () => {
    setGameState(prev => ({
      ...prev,
      board: Array(9).fill(''),
      currentPlayer: 'X',
      winner: null,
    }));
  };

  const handlePlayModeSelect = (mode: 'AI' | 'Local') => {
    setGameState(prev => ({
      ...prev,
      mode,
      board: Array(9).fill(''),
      currentPlayer: 'X',
      winner: null,
    }));
    setShowThemes(false); // Hide themes when starting a game
  };

  const handleThemeSelect = (themeName: string) => {
    setGameState(prev => ({ ...prev, theme: themeName }));
    setShowThemes(false); // Hide themes after selection
  };

  const currentThemeColors = THEMES[gameState.theme];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8 font-inter transition-colors duration-500"
      style={{ backgroundColor: currentThemeColors.primary, color: currentThemeColors.text }}
    >
      <h1 className="text-5xl font-extrabold mb-8 text-center">
        AAA Tic Tac Toe
      </h1>

      {!gameState.mode && !showThemes && (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => handlePlayModeSelect('AI')}
            className="p-4 rounded-lg text-2xl font-semibold transition-colors duration-200"
            style={{ backgroundColor: currentThemeColors.secondary, color: currentThemeColors.text, '--hover-bg': currentThemeColors.hover } as React.CSSProperties}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = currentThemeColors.hover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = currentThemeColors.secondary)}
          >
            Play vs AI
          </button>
          <button
            onClick={() => handlePlayModeSelect('Local')}
            className="p-4 rounded-lg text-2xl font-semibold transition-colors duration-200"
            style={{ backgroundColor: currentThemeColors.secondary, color: currentThemeColors.text, '--hover-bg': currentThemeColors.hover } as React.CSSProperties}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = currentThemeColors.hover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = currentThemeColors.secondary)}
          >
            Play Local Multiplayer
          </button>
          <button
            onClick={() => setShowThemes(true)}
            className="p-4 rounded-lg text-2xl font-semibold transition-colors duration-200"
            style={{ backgroundColor: currentThemeColors.secondary, color: currentThemeColors.text, '--hover-bg': currentThemeColors.hover } as React.CSSProperties}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = currentThemeColors.hover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = currentThemeColors.secondary)}
          >
            Themes
          </button>
        </div>
      )}

      {showThemes && (
        <div className="flex flex-col gap-4 p-8 rounded-lg" style={{ backgroundColor: currentThemeColors.secondary }}>
          <h2 className="text-3xl font-bold mb-4 text-center">Select Theme</h2>
          {Object.keys(THEMES).map(themeName => (
            <button
              key={themeName}
              onClick={() => handleThemeSelect(themeName)}
              className="flex items-center justify-center gap-4 p-4 rounded-lg text-xl font-semibold transition-colors duration-200"
              style={{ backgroundColor: currentThemeColors.secondary, color: currentThemeColors.text, '--hover-bg': currentThemeColors.hover } as React.CSSProperties}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = currentThemeColors.hover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = currentThemeColors.secondary)}
            >
              <div
                className="w-6 h-6 rounded-full border-2"
                style={{ backgroundColor: THEMES[themeName].primary, borderColor: THEMES[themeName].text }}
              ></div>
              <span className="capitalize">{themeName}</span>
            </button>
          ))}
          <button
            onClick={() => setShowThemes(false)}
            className="mt-4 p-4 rounded-lg text-xl font-semibold transition-colors duration-200"
            style={{ backgroundColor: currentThemeColors.x, color: currentThemeColors.text, '--hover-bg': currentThemeColors.hover } as React.CSSProperties}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = currentThemeColors.hover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = currentThemeColors.x)}
          >
            Back to Menu
          </button>
        </div>
      )}

      {gameState.mode && !showThemes && (
        <div className="flex flex-col items-center">
          <div className="text-3xl font-bold mb-8">
            {gameState.winner ? (
              gameState.winner.player === 'Draw' ? (
                'Draw!'
              ) : (
                <span style={{ color: gameState.winner.player === 'X' ? currentThemeColors.x : currentThemeColors.o }}>
                  Player {gameState.winner.player} Wins!
                </span>
              )
            ) : (
              <span>
                Player{' '}
                <span style={{ color: gameState.currentPlayer === 'X' ? currentThemeColors.x : currentThemeColors.o }}>
                  {gameState.currentPlayer}
                </span>
                's Turn
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {gameState.board.map((cell, i) => (
              <button
                key={i}
                onClick={() => handleCellClick(i)}
                className={`w-24 h-24 flex items-center justify-center rounded-lg text-5xl font-bold transition-colors duration-200
                  ${gameState.winner?.line?.includes(i) ? 'animate-pulse' : ''}
                `}
                style={{
                  backgroundColor: gameState.winner?.line?.includes(i) ? currentThemeColors.winning : currentThemeColors.secondary,
                  color: cell === 'X' ? currentThemeColors.x : currentThemeColors.o,
                  cursor: gameState.winner || cell !== '' ? 'default' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!gameState.winner && cell === '') {
                    e.currentTarget.style.backgroundColor = currentThemeColors.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!gameState.winner && cell === '') {
                    e.currentTarget.style.backgroundColor = currentThemeColors.secondary;
                  }
                }}
              >
                {cell}
              </button>
            ))}
          </div>

          {(gameState.winner || (gameState.mode === 'AI' && gameState.currentPlayer === 'X' && gameState.board.every(c => c !== '')) ) && (
            <button
              onClick={handleNewGame}
              className="mt-8 p-4 rounded-lg text-2xl font-semibold transition-colors duration-200"
              style={{ backgroundColor: currentThemeColors.secondary, color: currentThemeColors.text, '--hover-bg': currentThemeColors.hover } as React.CSSProperties}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = currentThemeColors.hover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = currentThemeColors.secondary)}
            >
              New Game
            </button>
          )}
        </div>
      )}
    </div>
  );
}
