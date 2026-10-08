"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { readLocal, writeLocal } from '@/lib/persist';
import { Button, Card, Badge, EmptyState, ListRow } from '@/components/ui';

export type RecordItem = { id: string; title: string; notes: string; createdAt: string };

type GameState = {
  board: string[] | null[];
  currentPlayer: 'X' | 'O';
  phase: 'idle' | 'queue' | 'playing' | 'victory' | 'draw';
  winner: 'X' | 'O' | null;
  winningCells: number[];
  settings: { skin: 'classic' | 'neon' | 'monochrome' };
  score: { x: number; o: number };
};

const STORAGE_KEY = "lastmile:aaa-tic-tac:gameState";

const INITIAL_STATE: GameState = {
  board: Array(9).fill(null),
  currentPlayer: 'X',
  phase: 'idle',
  winner: null,
  winningCells: [],
  settings: { skin: 'classic' },
  score: { x: 0, o: 0 },
};

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const checkWinCondition = (board: string[]): { winner: 'X' | 'O' | null; cells: number[] } => {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], cells: [a, b, c] };
    }
  }
  return { winner: null, cells: [] };
};

const usePersistedGame = () => {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  useEffect(() => {
    try {
      const saved = readLocal<GameState>(STORAGE_KEY, INITIAL_STATE);
      setState(saved);
    } catch {
      setState(INITIAL_STATE);
    }
  }, []);

  useEffect(() => {
    try {
      writeLocal(STORAGE_KEY, state);
    } catch {
      console.error('Persistence write failed');
    }
  }, [state]);

  return [state, setState] as const;
};

export const HUD = ({ opponent }: { opponent: string }) => (
  <div className="flex items-center gap-3 px-4 py-2 bg-[#14171c] border-b border-[#4f8cff]/20">
    <Badge tone="brand">LIVE</Badge>
    <span className="font-mono text-[#e6e9ef] text-sm tracking-wide">Opponent: {opponent}</span>
  </div>
);

export const ScorePanel = ({ score }: { score: { x: number; o: number } }) => (
  <Card className="p-4 bg-[#14171c] border border-[#4f8cff]/10 flex justify-between items-center">
    <div className="text-center">
      <div className="font-mono text-2xl text-[#4f8cff]">{score.x}</div>
      <div className="text-xs text-[#e6e9ef]/60 uppercase tracking-wider">Player X</div>
    </div>
    <div className="h-8 w-px bg-[#4f8cff]/20"></div>
    <div className="text-center">
      <div className="font-mono text-2xl text-[#e6e9ef]/80">{score.o}</div>
      <div className="text-xs text-[#e6e9ef]/60 uppercase tracking-wider">CPU O</div>
    </div>
  </Card>
);

export const MatchmakingOverlay = ({ onStart }: { onStart: () => void }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 2;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onStart, 200);
          return 100;
        }
        return next;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [onStart]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0d10]/90 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 bg-[#14171c] border border-[#4f8cff]/20">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-mono text-[#e6e9ef] text-sm">SEARCHING OPPONENT...</span>
          <span className="font-mono text-[#4f8cff] text-sm">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full bg-[#0b0d10] rounded overflow-hidden">
          <div 
            className="h-full bg-[#4f8cff] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-4 text-xs text-[#e6e9ef]/50 font-mono">Estimating latency & matching skill tier...</p>
      </Card>
    </div>
  );
};

export const ResultModal = ({ 
  phase, 
  winner, 
  winningCells, 
  onPlayAgain 
}: { 
  phase: 'victory' | 'draw'; 
  winner: 'X' | 'O' | null; 
  winningCells: number[]; 
  onPlayAgain: () => void; 
}) => {
  const isVictory = phase === 'victory';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0d10]/95 backdrop-blur-md">
      <Card className="w-full max-w-sm p-8 bg-[#14171c] border border-[#4f8cff]/20 text-center">
        <div className="mb-4">
          {isVictory ? (
            <Badge tone="pass">VICTORY</Badge>
          ) : (
            <Badge tone="warn">DRAW</Badge>
          )}
        </div>
        <h2 className="font-mono text-xl text-[#e6e9ef] mb-2">
          {isVictory ? `Player ${winner} Wins` : 'Board Full'}
        </h2>
        <p className="text-sm text-[#e6e9ef]/60 mb-6">
          {isVictory ? 'Excellent execution. Resetting board.' : 'No remaining moves. Draw declared.'}
        </p>
        <Button variant="primary" size="md" onClick={onPlayAgain} className="w-full">
          Play Again
        </Button>
      </Card>
    </div>
  );
};

export const GameBoard = ({ 
  state, 
  dispatch 
}: { 
  state: GameState; 
  dispatch: React.Dispatch<React.Reducer<GameState, any>>; 
}) => {
  const skinStyles = {
    classic: 'border-[#4f8cff]/30 bg-[#14171c]',
    neon: 'border-[#4f8cff] bg-[#0b0d10] shadow-[0_0_10px_rgba(79,140,255,0.3)]',
    monochrome: 'border-[#e6e9ef]/20 bg-[#14171c]'
  }[state.settings.skin];

  const handleCellClick = useCallback((index: number) => {
    if (state.phase !== 'playing' || state.board[index] !== null) return;

    dispatch({
      type: 'PLACE',
      payload: { index, player: state.currentPlayer }
    });
  }, [state.phase, state.board, state.currentPlayer, dispatch]);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, [dispatch]);

  return (
    <div className="relative">
      <div className={`grid grid-cols-3 gap-2 p-2 rounded-lg ${skinStyles}`}>
        {state.board.map((cell, idx) => {
          const isWinning = state.winningCells.includes(idx);
          const isOccupied = cell !== null;
          return (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              disabled={state.phase !== 'playing' || isOccupied}
              className={`
                aspect-square flex items-center justify-center rounded-md transition-all duration-150
                ${isOccupied ? 'cursor-not-allowed animate-[shake_0.3s_ease-in-out]' : 'hover:bg-[#4f8cff]/10 cursor-pointer'}
                ${isWinning ? 'shadow-[0_0_15px_3px_rgba(255,215,0,0.6)] border-yellow-400 bg-[#14171c]' : ''}
                ${!isOccupied && !isWinning ? 'border border-[#4f8cff]/10' : ''}
              `}
            >
              {cell && (
                <span className={`font-mono text-3xl font-bold ${cell === 'X' ? 'text-[#4f8cff]' : 'text-[#e6e9ef]'}`}>
                  {cell}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {state.phase === 'playing' && (
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <span className="font-mono text-xs text-[#e6e9ef]/50">
            TURN: <span className="text-[#4f8cff]">{state.currentPlayer}</span>
          </span>
        </div>
      )}
    </div>
  );
};

export const SettingsWidget = ({ 
  settings, 
  onChange 
}: { 
  settings: { skin: 'classic' | 'neon' | 'monochrome' }; 
  onChange: (skin: 'classic' | 'neon' | 'monochrome') => void; 
}) => {
  const skins: { value: 'classic' | 'neon' | 'monochrome'; label: string }[] = [
    { value: 'classic', label: 'Classic Grid' },
    { value: 'neon', label: 'Neon Glow' },
    { value: 'monochrome', label: 'Monochrome' }
  ];

  return (
    <Card className="p-4 bg-[#14171c] border border-[#4f8cff]/10">
      <label className="block text-xs font-mono text-[#e6e9ef]/60 mb-2 uppercase tracking-wider">
        Board Skin
      </label>
      <select
        value={settings.skin}
        onChange={(e) => onChange(e.target.value as 'classic' | 'neon' | 'monochrome')}
        className="w-full bg-[#0b0d10] border border-[#4f8cff]/20 rounded px-3 py-2 text-[#e6e9ef] font-mono text-sm focus:outline-none focus:border-[#4f8cff]"
      >
        {skins.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </Card>
  );
};

export const MoveHistory = ({ history }: { history: RecordItem[] }) => (
  <Card className="p-4 bg-[#14171c] border border-[#4f8cff]/10 h-64 flex flex-col">
    <h3 className="font-mono text-sm text-[#e6e9ef] mb-3 uppercase tracking-wider">Match Log</h3>
    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
      {history.length === 0 ? (
        <EmptyState 
          title="No Moves Recorded" 
          message="Place your first mark to begin logging." 
          className="py-8"
        />
      ) : (
        history.map(item => (
          <ListRow 
            key={item.id} 
            title={item.title} 
            subtitle={item.notes} 
            trailing={<span className="font-mono text-xs text-[#4f8cff]">{item.createdAt}</span>}
            className="border-b border-[#4f8cff]/10 pb-2 last:border-0"
          />
        ))
      )}
    </div>
  </Card>
);

export default function TripleATicTacToeWidgets() {
  const [state, dispatch] = React.useReducer(
    (prev: GameState, action: any): GameState => {
      switch (action.type) {
        case 'START_QUEUE':
          return { ...prev, phase: 'queue' };
        case 'START_PLAYING':
          return { ...prev, phase: 'playing', board: Array(9).fill(null) };
        case 'PLACE': {
          const { index, player } = action.payload;
          const newBoard = [...prev.board];
          newBoard[index] = player;
          const result = checkWinCondition(newBoard);
          const nextPlayer = player === 'X' ? 'O' : 'X';
          let newPhase = prev.phase;
          let newWinner = prev.winner;
          let newWinningCells = prev.winningCells;
          let newScore = { ...prev.score };

          if (result.winner) {
            newPhase = 'victory';
            newWinner = result.winner;
            newWinningCells = result.cells;
            newScore[result.winner.toLowerCase() as 'x' | 'o'] += 1;
          } else if (!newBoard.includes(null)) {
            newPhase = 'draw';
          }

          return {
            ...prev,
            board: newBoard,
            currentPlayer: newPhase === 'playing' ? nextPlayer : prev.currentPlayer,
            phase: newPhase,
            winner: newWinner,
            winningCells: newWinningCells,
            score: newScore
          };
        }
        case 'RESET_GAME':
          return { ...prev, board: Array(9).fill(null), phase: 'idle', winner: null, winningCells: [], currentPlayer: 'X' };
        case 'UPDATE_SETTINGS':
          return { ...prev, settings: { ...prev.settings, skin: action.skin } };
        default:
          return prev;
      }
    },
    INITIAL_STATE
  );

  const handleFindMatch = () => {
    dispatch({ type: 'START_QUEUE' });
  };

  const handleQueueComplete = () => {
    dispatch({ type: 'START_PLAYING' });
  };

  const handleSkinChange = (skin: 'classic' | 'neon' | 'monochrome') => {
    dispatch({ type: 'UPDATE_SETTINGS', skin });
  };

  const handlePlayAgain = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  const mockHistory: RecordItem[] = [];

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e6e9ef] p-6 font-sans">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between border-b border-[#4f8cff]/20 pb-4">
          <h1 className="font-mono text-xl tracking-tight text-[#e6e9ef]">TRIPLEA TIC-TAC-TOE</h1>
          <Badge tone="neutral">v1.0.0</Badge>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <HUD opponent="CPU_α" />
            <ScorePanel score={state.score} />
            
            {state.phase === 'idle' && (
              <div className="flex justify-center py-8">
                <Button variant="primary" size="lg" onClick={handleFindMatch}>
                  Find Match
                </Button>
              </div>
            )}

            {(state.phase === 'queue' || state.phase === 'playing' || state.phase === 'victory' || state.phase === 'draw') && (
              <GameBoard state={state} dispatch={dispatch} />
            )}

            {state.phase === 'queue' && (
              <MatchmakingOverlay onStart={handleQueueComplete} />
            )}

            {(state.phase === 'victory' || state.phase === 'draw') && (
              <ResultModal 
                phase={state.phase} 
                winner={state.winner} 
                winningCells={state.winningCells} 
                onPlayAgain={handlePlayAgain} 
              />
            )}
          </div>

          <div className="space-y-6">
            <SettingsWidget settings={state.settings} onChange={handleSkinChange} />
            <MoveHistory history={mockHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}