"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Badge, EmptyState, ListRow } from '@/components/ui';

export type Record = { id: string; title: string; notes: string; createdAt: string };

const STORAGE_KEY = 'lastmile:aaa-tic-tac:GameState';
const SKIN_KEY = 'triad_equipped_skin';

// --- Helpers ---
function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function checkWinner(board: string[][], size: number): { winner: string | null; cells: [number, number][] } {
  const lines: [number, number][][] = [];
  // Rows
  for (let r = 0; r < size; r++) lines.push(Array.from({ length: size }, (_, c) => [r, c]));
  // Cols
  for (let c = 0; c < size; c++) lines.push(Array.from({ length: size }, (_, r) => [r, c]));
  // Diagonals
  lines.push(Array.from({ length: size }, (_, i) => [i, i]));
  lines.push(Array.from({ length: size }, (_, i) => [i, size - 1 - i]));

  for (const line of lines) {
    const symbols = line.map(([r, c]) => board[r][c]);
    if (symbols.every(s => s !== '' && s === symbols[0])) {
      return { winner: symbols[0], cells: line };
    }
  }
  return { winner: null, cells: [] };
}

function getAIMove(board: string[][], size: number, aiSymbol: string): [number, number] | null {
  const empty: [number, number][] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === '') empty.push([r, c]);
    }
  }
  if (empty.length === 0) return null;
  // Slight randomization to avoid deterministic solves
  return empty[Math.floor(Math.random() * empty.length)];
}

// --- Components ---

export function MatchmakingOverlay({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(Math.round((elapsed / duration) * 100), 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(onComplete, 150);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0d10]/95 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 rounded-lg border border-[#4f8cff]/20 bg-[#14171c] shadow-xl">
        <div className="mb-4 text-[#e6e9ef] font-mono text-sm tracking-wider">INITIALIZING MATCHMAKING</div>
        <div className="h-2 w-full bg-[#0b0d10] rounded overflow-hidden">
          <div
            className="h-full bg-[#4f8cff] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-[#e6e9ef]/60 font-mono">{progress}% CONNECTED</div>
      </div>
    </div>
  );
}

export function GameBoard() {
  const router = useRouter();
  const [size, setSize] = useState(3);
  const [board, setBoard] = useState<string[][]>(() => Array.from({ length: 3 }, () => Array(3).fill('')));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [draw, setDraw] = useState(false);
  const [winningCells, setWinningCells] = useState<[number, number][]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [equippedSkin, setEquippedSkin] = useState<string>('');
  const [history, setHistory] = useState<Record[]>([]);
  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({ msg: '', visible: false });
  const lastPlacedRef = useRef<HTMLButtonElement | null>(null);

  // Load persisted state & skin
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBoard(parsed.board || board);
        setSize(parsed.size || 3);
        setCurrentPlayer(parsed.currentPlayer || 'X');
        setWinner(parsed.winner);
        setDraw(parsed.draw);
        setWinningCells(parsed.winningCells || []);
        setHistory(parsed.history || []);
      } catch {
        // Corrupted state fallback
      }
    }
    const skin = localStorage.getItem(SKIN_KEY);
    if (skin) setEquippedSkin(skin);
  }, []);

  // Persist state
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ board, size, currentPlayer, winner, draw, winningCells, history })
    );
  }, [board, size, currentPlayer, winner, draw, winningCells, history]);

  // AI Turn Simulation
  useEffect(() => {
    if (currentPlayer === 'O' && !winner && !draw) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const move = getAIMove(board, size, 'O');
        if (move) {
          setBoard(prev => {
            const next = prev.map(r => [...r]);
            next[move[0]][move[1]] = 'O';
            return next;
          });
          setCurrentPlayer('X');
          setIsAiThinking(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, winner, draw, board, size]);

  // Check result after every board change
  useEffect(() => {
    const { winner: w, cells } = checkWinner(board, size);
    if (w) {
      setWinner(w);
      setWinningCells(cells);
    } else if (board.flat().every(c => c !== '') && !w) {
      setDraw(true);
    }
  }, [board, size]);

  const handleCellClick = (r: number, c: number) => {
    if (winner || draw || board[r][c] !== '' || currentPlayer !== 'X') return;

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = 'X';
    setBoard(newBoard);

    // Focus management
    lastPlacedRef.current = document.querySelector(`[data-cell="${r}-${c}"]`) as HTMLButtonElement;
    lastPlacedRef.current?.focus();

    // Log move
    const logEntry: Record = {
      id: generateId(),
      title: `Move ${history.length + 1}`,
      notes: `Player X placed at (${r}, ${c})`,
      createdAt: new Date().toISOString()
    };
    setHistory(prev => [...prev, logEntry]);

    setCurrentPlayer('O');
  };

  const handleOccupiedClick = (r: number, c: number) => {
    if (lastPlacedRef.current) {
      lastPlacedRef.current.focus();
    }
  };

  const handleQuickMatch = () => {
    router.push('/matchmaking');
  };

  const handleVariantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    setSize(newSize);
    setBoard(Array.from({ length: newSize }, () => Array(newSize).fill('')));
    setCurrentPlayer('X');
    setWinner(null);
    setDraw(false);
    setWinningCells([]);
  };

  const handleEquipSkin = (skinId: string) => {
    localStorage.setItem(SKIN_KEY, skinId);
    setEquippedSkin(skinId);
    setToast({ msg: 'Skin equipped', visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000);
  };

  const skinOptions = [
    { id: 'neon-cyan', name: 'Neon Cyan', preview: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)' },
    { id: 'ember-orange', name: 'Ember Orange', preview: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)' },
    { id: 'void-purple', name: 'Void Purple', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
  ];

  const boardWrapperClass = `relative p-4 rounded-lg border ${
    equippedSkin ? `border-[${equippedSkin}] shadow-[0_0_15px_rgba(79,140,255,0.3)]` : 'border-[#4f8cff]/20'
  } bg-[#14171c]`;

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e6e9ef] font-sans selection:bg-[#4f8cff]/30">
      <style>{`
        @keyframes win-flash {
          0% { background-color: transparent; transform: scale(1); }
          50% { background-color: rgba(79, 140, 255, 0.4); transform: scale(1.05); }
          100% { background-color: transparent; transform: scale(1); }
        }
        .win-row {
          animation: win-flash 1.2s ease-in-out infinite;
          border-radius: 0.5rem;
        }
      `}</style>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#4f8cff]/10 bg-[#14171c]">
        <div className="flex items-center gap-3">
          <Badge tone="brand" />
          <span className="font-mono text-sm tracking-widest text-[#4f8cff]">TRIAD ARENA</span>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={size}
            onChange={handleVariantChange}
            className="bg-[#0b0d10] border border-[#4f8cff]/20 rounded px-2 py-1 text-xs font-mono text-[#e6e9ef] focus:outline-none focus:border-[#4f8cff]"
          >
            <option value={3}>Standard 3x3</option>
            <option value={9}>Ultimate 9x9</option>
          </select>
          <Button variant="primary" size="sm" onClick={handleQuickMatch}>Quick Match</Button>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto">
        {/* Game Area */}
        <section className="flex-1 flex flex-col items-center gap-6">
          <div className="flex items-center justify-between w-full max-w-md">
            <span className="font-mono text-xs text-[#e6e9ef]/60">MATCH STATUS</span>
            <span
              data-testid="turn-indicator"
              className={`font-mono text-sm font-bold ${
                winner ? 'text-[#4f8cff]' : currentPlayer === 'X' ? 'text-[#e6e9ef]' : 'text-[#e6e9ef]/70'
              }`}
            >
              {winner ? 'GAME OVER' : draw ? 'DRAW' : isAiThinking ? "Opponent's Turn" : 'Your Turn'}
            </span>
          </div>

          <div className={`${boardWrapperClass} transition-all duration-300`}>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
            >
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const isWinning = winningCells.some(([wr, wc]) => wr === r && wc === c);
                  const isEmpty = cell === '';
                  return (
                    <button
                      key={`${r}-${c}`}
                      data-cell={`${r}-${c}`}
                      onClick={() => isEmpty ? handleCellClick(r, c) : handleOccupiedClick(r, c)}
                      disabled={!isEmpty || !!winner || !!draw || currentPlayer !== 'X'}
                      className={`
                        aspect-square flex items-center justify-center rounded-md border font-mono text-lg md:text-2xl transition-all duration-200
                        ${isEmpty
                          ? 'border-[#4f8cff]/10 bg-[#0b0d10] hover:border-[#4f8cff]/40 cursor-pointer'
                          : 'border-[#4f8cff]/20 bg-[#14171c] cell-occupied cursor-default'
                        }
                        ${isWinning ? 'win-row border-[#4f8cff]' : ''}
                        ${!isEmpty && cell === 'X' ? 'text-[#4f8cff]' : ''}
                        ${!isEmpty && cell === 'O' ? 'text-[#e6e9ef]/60' : ''}
                      `}
                    >
                      {cell}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {(winner || draw) && (
            <div className="flex gap-3">
              <Button variant="secondary" size="md" onClick={() => {
                setBoard(Array.from({ length: size }, () => Array(size).fill('')));
                setCurrentPlayer('X');
                setWinner(null);
                setDraw(false);
                setWinningCells([]);
              }}>Rematch</Button>
              <Button variant="ghost" size="md" onClick={() => router.push('/')}>Return Home</Button>
            </div>
          )}
        </section>

        {/* Sidebar: History & Skins */}
        <aside className="w-full lg:w-80 flex flex-col gap-6">
          <Card className="p-4 border border-[#4f8cff]/10 bg-[#14171c]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs tracking-wider text-[#e6e9ef]/70">MOVE LOG</span>
              <Badge tone="neutral" />
            </div>
            {history.length === 0 ? (
              <EmptyState
                title="No Moves Recorded"
                message="Play a match to populate the activity feed."
                className="py-4"
              />
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {history.slice().reverse().map((rec) => (
                  <ListRow
                    key={rec.id}
                    record={rec}
                    title={rec.title}
                    subtitle={rec.notes}
                    trailing={<span className="text-[10px] font-mono text-[#e6e9ef]/40">{new Date(rec.createdAt).toLocaleTimeString()}</span>}
                    className="hover:bg-[#0b0d10]/50"
                  />
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4 border border-[#4f8cff]/10 bg-[#14171c]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs tracking-wider text-[#e6e9ef]/70">SKINS</span>
              <Badge tone="pass" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {skinOptions.map((skin) => (
                <div
                  key={skin.id}
                  className="group relative aspect-square rounded-md overflow-hidden border border-[#4f8cff]/10 bg-[#0b0d10] transition-transform duration-200 hover:scale-[1.05]"
                >
                  <div
                    className="absolute inset-0 opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{ background: skin.preview }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleEquipSkin(skin.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Equip
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </main>

      {/* Toast */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 px-4 py-2 rounded-md bg-[#14171c] border border-[#4f8cff]/20 text-sm font-mono text-[#e6e9ef] shadow-lg animate-in fade-in slide-in-from-bottom-4">
          {toast.msg}
        </div>
      )}
    </div>
  );
}

export function SkinSelectionPage() {
  const [equipped, setEquipped] = useState<string>('');
  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({ msg: '', visible: false });

  useEffect(() => {
    const saved = localStorage.getItem(SKIN_KEY);
    if (saved) setEquipped(saved);
  }, []);

  const handleEquip = (id: string) => {
    localStorage.setItem(SKIN_KEY, id);
    setEquipped(id);
    setToast({ msg: 'Skin equipped', visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000);
  };

  const skins = [
    { id: 'neon-cyan', name: 'Neon Cyan', desc: 'High contrast cyan glow for night sessions.', preview: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)' },
    { id: 'ember-orange', name: 'Ember Orange', desc: 'Warm tones that reduce eye strain during long matches.', preview: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)' },
    { id: 'void-purple', name: 'Void Purple', desc: 'Deep spectral shift for maximum immersion.', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
  ];

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e6e9ef] font-sans p-6">
      <header className="max-w-4xl mx-auto mb-12">
        <h1 className="font-mono text-2xl tracking-widest text-[#4f8cff] mb-2">CUSTOMIZATION</h1>
        <p className="text-[#e6e9ef]/60 max-w-lg">Select a visual profile. Changes apply immediately across the arena.</p>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {skins.map((skin) => (
          <Card key={skin.id} className={`p-5 border transition-all duration-200 hover:scale-[1.05] ${
            equipped === skin.id ? 'border-[#4f8cff] shadow-[0_0_15px_rgba(79,140,255,0.2)]' : 'border-[#4f8cff]/10'
          }`}>
            <div className="aspect-video rounded-md mb-4 overflow-hidden relative">
              <div className="absolute inset-0" style={{ background: skin.preview }} />
              {equipped === skin.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Badge tone="pass" />
                </div>
              )}
            </div>
            <h3 className="font-mono text-sm tracking-wider mb-1">{skin.name}</h3>
            <p className="text-xs text-[#e6e9ef]/60 mb-4 h-8">{skin.desc}</p>
            <Button
              variant={equipped === skin.id ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => handleEquip(skin.id)}
              className="w-full"
            >
              {equipped === skin.id ? 'Active' : 'Equip'}
            </Button>
          </Card>
        ))}
      </div>

      {toast.visible && (
        <div className="fixed bottom-6 right-6 px-4 py-2 rounded-md bg-[#14171c] border border-[#4f8cff]/20 text-sm font-mono text-[#e6e9ef] shadow-lg animate-in fade-in slide-in-from-bottom-4">
          {toast.msg}
        </div>
      )}
    </div>
  );
}
