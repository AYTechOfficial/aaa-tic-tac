"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { readLocal, writeLocal } from '@/lib/persist';
import { Button, Card, Badge, EmptyState, ListRow } from '@/components/ui';

type Player = 'X' | 'O';
type Cell = Player | null;
type Board = Cell[];
type Skin = 'classic' | 'neon' | 'wood';
type Phase = 'idle' | 'matchmaking' | 'playing' | 'won' | 'draw';

interface GameState {
  board: Board;
  currentPlayer: Player;
  phase: Phase;
  opponent: string;
  selectedSkin: Skin;
  audioEnabled: boolean;
  winningCells: number[] | null;
}

const STORAGE_KEY = "lastmile:aaa-tic-tac:gameState";
const INITIAL_STATE: GameState = {
  board: Array(9).fill(null),
  currentPlayer: 'X',
  phase: 'idle',
  opponent: '',
  selectedSkin: 'classic',
  audioEnabled: true,
  winningCells: null,
};

const WIN_LINES = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];

export default function SettingsPage() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [progress, setProgress] = useState(0);
  const [shakeCell, setShakeCell] = useState<number | null>(null);
  const [showPanel, setShowPanel] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = readLocal<GameState>(STORAGE_KEY, INITIAL_STATE);
      setState(saved);
    } catch (e) {
      setErrorMsg('Failed to initialize session data.');
    }
  }, []);

  useEffect(() => {
    try {
      writeLocal(STORAGE_KEY, state);
    } catch (e) {
      setErrorMsg('Persistence write failed. Local changes may not survive reload.');
    }
  }, [state]);

  const startMatchmaking = () => {
    setState(prev => ({ ...prev, phase: 'matchmaking', opponent: '' }));
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 5;
      });
    }, 100);

    setTimeout(() => {
      setState(prev => ({
        ...prev,
        phase: 'playing',
        opponent: 'CPU_α',
        board: Array(9).fill(null),
        currentPlayer: 'X',
        winningCells: null
      }));
      setProgress(0);
    }, 2000);
  };

  const handleCellClick = (index: number) => {
    if (state.phase !== 'playing' || state.board[index]) {
      if (state.board[index]) {
        setShakeCell(index);
        setTimeout(() => setShakeCell(null), 300);
      }
      return;
    }

    const newBoard = [...state.board];
    newBoard[index] = state.currentPlayer;
    const nextPlayer = state.currentPlayer === 'X' ? 'O' : 'X';

    let winningCells = null;
    for (const line of WIN_LINES) {
      if (line.every(i => newBoard[i] === state.currentPlayer)) {
        winningCells = line;
        break;
      }
    }

    const isDraw = !newBoard.includes(null) && !winningCells;

    setState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: nextPlayer,
      phase: winningCells ? 'won' : (isDraw ? 'draw' : 'playing'),
      winningCells
    }));
  };

  const resetGame = () => {
    setState(prev => ({
      ...prev,
      board: Array(9).fill(null),
      currentPlayer: 'X',
      phase: 'idle',
      opponent: '',
      winningCells: null
    }));
    setErrorMsg(null);
  };

  const changeSkin = (skin: Skin) => {
    setState(prev => ({ ...prev, selectedSkin: skin }));
  };

  const toggleAudio = () => {
    setState(prev => ({ ...prev, audioEnabled: !prev.audioEnabled }));
  };

  const getSkinClasses = () => {
    switch(state.selectedSkin) {
      case 'neon': return 'border-[#4f8cff] shadow-[0_0_10px_#4f8cff]';
      case 'wood': return 'border-[#8b5a2b] bg-[#1a1510]';
      default: return 'border-[#2a2d35]';
    }
  };

  const getBoardBg = () => {
    switch(state.selectedSkin) {
      case 'neon': return 'bg-[#0a0f14]';
      case 'wood': return 'bg-[#12100d]';
      default: return 'bg-[#14171c]';
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e6e9ef] font-sans">
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#2a2d35]">
        <h1 className="text-lg font-bold tracking-wider font-mono">TRIPLE_A_TIC_TAC_TOE</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPanel(!showPanel)}>
            {showPanel ? 'Hide Panel' : 'Show Panel'}
          </Button>
          <Button variant="primary" size="sm" onClick={startMatchmaking}>
            Find Match
          </Button>
        </div>
      </header>

      {errorMsg && (
        <div className="px-6 py-2 bg-red-900/30 border-b border-red-800 text-red-200 text-sm font-mono">
          {errorMsg}
        </div>
      )}

      <main className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
        <aside className={`w-full lg:w-80 border-r border-[#2a2d35] p-6 overflow-y-auto ${showPanel ? 'block' : 'hidden lg:block'}`}>
          <Card className="mb-6 bg-[#14171c] border-[#2a2d35]">
            <div className="p-4 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-[#4f8cff]">Cosmetics</h2>
              <div className="space-y-2">
                <label className="text-xs text-gray-400 block">Board Skin</label>
                <select
                  value={state.selectedSkin}
                  onChange={(e) => changeSkin(e.target.value as Skin)}
                  className="w-full bg-[#0b0d10] border border-[#2a2d35] rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#4f8cff]"
                >
                  <option value="classic">Classic Grid</option>
                  <option value="neon">Neon Glow</option>
                  <option value="wood">Retro Wood</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Audio Feedback</span>
                <button
                  onClick={toggleAudio}
                  className={`w-10 h-5 rounded-full relative transition-colors ${state.audioEnabled ? 'bg-[#4f8cff]' : 'bg-[#2a2d35]'}`}
                >
                  <span className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${state.audioEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </Card>

          <Card className="mb-6 bg-[#14171c] border-[#2a2d35]">
            <div className="p-4 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-[#4f8cff]">System</h2>
              <ListRow
                title="Session Data"
                subtitle={`ID: ${Math.random().toString(36).substr(2, 8).toUpperCase()}`}
                trailing={<Badge tone="neutral">Active</Badge>}
              />
              <ListRow
                title="Storage Status"
                subtitle="IndexedDB Synced"
                trailing={<Badge tone="pass">OK</Badge>}
              />
              <Button variant="danger" size="md" className="w-full" onClick={resetGame}>
                Reset Session
              </Button>
            </div>
          </Card>

          {state.phase === 'idle' && (
            <EmptyState
              title="No Active Match"
              description="Initialize a session to begin gameplay."
              action={<Button variant="primary" onClick={startMatchmaking}>Start Session</Button>}
            />
          )}
        </aside>

        <section className="flex-1 flex flex-col items-center justify-center p-6 relative">
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Badge tone={state.phase === 'playing' ? 'brand' : 'neutral'}>{state.phase.toUpperCase()}</Badge>
              {state.opponent && <span className="font-mono text-sm text-gray-400">Opponent: {state.opponent}</span>}
            </div>
            <span className="font-mono text-sm text-gray-400">Turn: {state.currentPlayer}</span>
          </div>

          {state.phase === 'matchmaking' && (
            <div className="absolute inset-0 bg-[#0b0d10]/90 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <div className="w-64 space-y-4">
                <p className="text-center font-mono text-sm text-[#4f8cff] animate-pulse">SEARCHING FOR OPPONENT...</p>
                <div className="h-2 bg-[#2a2d35] rounded-full overflow-hidden">
                  <div className="h-full bg-[#4f8cff] transition-all duration-100" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-center text-xs text-gray-500">{progress}% COMPLETE</p>
              </div>
            </div>
          )}

          <div className={`relative grid grid-cols-3 gap-2 p-2 rounded-lg ${getBoardBg()} ${getSkinClasses()}`}>
            {state.board.map((cell, i) => (
              <button
                key={i}
                onClick={() => handleCellClick(i)}
                disabled={state.phase !== 'playing'}
                className={`w-20 h-20 flex items-center justify-center text-2xl font-bold font-mono transition-all duration-75
                  ${cell ? 'text-[#e6e9ef]' : 'text-gray-600 hover:bg-[#1a1d24]'}
                  ${state.winningCells?.includes(i) ? 'ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : ''}
                  ${shakeCell === i ? 'translate-x-1' : ''}
                `}
              >
                {cell}
              </button>
            ))}
          </div>

          {state.phase === 'won' && (
            <div className="absolute inset-0 bg-[#0b0d10]/80 backdrop-blur-sm flex items-center justify-center z-20">
              <Card className="bg-[#14171c] border-[#2a2d35] p-8 max-w-sm text-center">
                <h2 className="text-xl font-bold mb-2 text-[#4f8cff]">VICTORY CONFIRMED</h2>
                <p className="text-sm text-gray-400 mb-6">Player {state.currentPlayer === 'X' ? 'O' : 'X'} secured the match.</p>
                <div className="flex gap-3 justify-center">
                  <Button variant="secondary" onClick={resetGame}>Return to Lobby</Button>
                  <Button variant="primary" onClick={() => setState(prev => ({...prev, phase: 'playing', board: Array(9).fill(null), currentPlayer: 'X', winningCells: null}))}>Play Again</Button>
                </div>
              </Card>
            </div>
          )}

          {state.phase === 'draw' && (
            <div className="absolute inset-0 bg-[#0b0d10]/80 backdrop-blur-sm flex items-center justify-center z-20">
              <Card className="bg-[#14171c] border-[#2a2d35] p-8 max-w-sm text-center">
                <h2 className="text-xl font-bold mb-2 text-gray-300">DRAW DETECTED</h2>
                <p className="text-sm text-gray-400 mb-6">Grid capacity reached. No winner.</p>
                <div className="flex gap-3 justify-center">
                  <Button variant="secondary" onClick={resetGame}>Return to Lobby</Button>
                  <Button variant="primary" onClick={() => setState(prev => ({...prev, phase: 'playing', board: Array(9).fill(null), currentPlayer: 'X', winningCells: null}))}>Play Again</Button>
                </div>
              </Card>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}