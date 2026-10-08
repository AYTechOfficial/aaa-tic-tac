"use client";
import { useState, useEffect, useCallback } from 'react';
import { readLocal, writeLocal } from '@/lib/persist';
import { Button, Card, Badge, EmptyState, ListRow } from '@/components/ui';

type RecordItem = { id: string; title: string; notes: string; createdAt: string };
type Phase = 'lobby' | 'queue' | 'playing' | 'victory' | 'draw';

interface AppState {
  phase: Phase;
  board: (string | null)[];
  turn: 'X' | 'O';
  opponent: string;
  progress: number;
  selectedSkin: 'classic' | 'neon' | 'retro';
  recentMatches: RecordItem[];
  winningLine: number[] | null;
  shakingCell: number | null;
}

const STORAGE_KEY = "lastmile:aaa-tic-tac:gameState";

export default function Page() {
  const [s, setS] = useState<AppState>({
    phase: 'lobby',
    board: Array(9).fill(null),
    turn: 'X',
    opponent: 'CPU_α',
    progress: 0,
    selectedSkin: 'classic',
    recentMatches: [],
    winningLine: null,
    shakingCell: null
  });

  useEffect(() => {
    try {
      const raw = readLocal<AppState | null>(STORAGE_KEY, null);
      if (raw) setS(p => ({ ...p, ...raw }));
    } catch {}
  }, []);

  useEffect(() => {
    try { writeLocal(STORAGE_KEY, s); } catch {}
  }, [s]);

  useEffect(() => {
    if (s.phase !== 'queue') return;
    const t0 = Date.now();
    const iv = setInterval(() => {
      const p = Math.min(((Date.now() - t0) / 2000) * 100, 100);
      setS(ps => ({ ...ps, progress: p }));
      if (p >= 100) {
        clearInterval(iv);
        setS(ps => ({ ...ps, phase: 'playing', board: Array(9).fill(null), turn: 'X', progress: 0 }));
      }
    }, 50);
    return () => clearInterval(iv);
  }, [s.phase]);

  const checkWin = useCallback((b: (string|null)[]) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const l of lines) {
      const [a, bIdx, c] = l;
      if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) return { winner: b[a], line: l };
    }
    return null;
  }, []);

  const place = (i: number) => {
    if (s.phase !== 'playing') return;
    if (s.board[i]) {
      setS(ps => ({ ...ps, shakingCell: i }));
      setTimeout(() => setS(ps => ({ ...ps, shakingCell: null })), 300);
      return;
    }
    const nb = [...s.board];
    nb[i] = s.turn;
    const res = checkWin(nb);
    if (res) {
      setS(ps => ({ ...ps, board: nb, phase: 'victory', winningLine: res.line }));
    } else if (nb.every(Boolean)) {
      setS(ps => ({ ...ps, board: nb, phase: 'draw' }));
    } else {
      setS(ps => ({ ...ps, board: nb, turn: s.turn === 'X' ? 'O' : 'X' }));
    }
  };

  const reset = () => {
    setS(ps => ({ ...ps, phase: 'playing', board: Array(9).fill(null), turn: 'X', winningLine: null }));
  };

  const skinBorder = s.selectedSkin === 'neon' ? 'border-[#4f8cff] shadow-[0_0_8px_#4f8cff]' :
                     s.selectedSkin === 'retro' ? 'border-[#e6e9ef] border-dashed' :
                     'border-[#14171c]';

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e6e9ef] font-sans flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#14171c]">
        <h1 className="text-lg font-bold tracking-tight">TRIPLEA TIC-TAC-TOE</h1>
        {(s.phase === 'playing' || s.phase === 'victory' || s.phase === 'draw') && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#4f8cff] font-mono">Opponent: {s.opponent}</span>
            <Badge tone={s.turn === 'X' ? 'brand' : 'neutral'}>{s.turn}'s Turn</Badge>
          </div>
        )}
        <a href="/settings"><Button variant="ghost" size="sm">Settings</Button></a>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        {s.phase === 'lobby' && (
          <div className="w-full max-w-md space-y-6">
            <Card className="p-6 flex flex-col items-center gap-4 bg-[#14171c]">
              <h2 className="text-xl font-semibold">Ready to play?</h2>
              <Button variant="primary" size="lg" onClick={() => setS(ps => ({ ...ps, phase: 'queue' }))}>Find Match</Button>
            </Card>
            <Card className="p-4 bg-[#14171c]">
              <h3 className="text-sm font-mono text-[#4f8cff] mb-3 uppercase tracking-wider">Recent Matches</h3>
              {s.recentMatches.length === 0 ? (
                <EmptyState title="No history yet" message="Play your first match to see results here." />
              ) : (
                <div className="space-y-2">
                  {s.recentMatches.map(m => (
                    <ListRow key={m.id} record={m} className="py-2" />
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {s.phase === 'queue' && (
          <div className="fixed inset-0 z-50 bg-[#0b0d10]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">Searching for opponent...</p>
              <p className="text-sm text-gray-400 font-mono">Estimated time: ~2s</p>
            </div>
            <div className="w-64 h-1.5 bg-[#14171c] rounded-full overflow-hidden">
              <div className="h-full bg-[#4f8cff] transition-all duration-100 ease-linear" style={{ width: `${s.progress}%` }} />
            </div>
          </div>
        )}

        {(s.phase === 'playing' || s.phase === 'victory' || s.phase === 'draw') && (
          <div className="relative">
            <div className={`grid grid-cols-3 gap-2 p-2 rounded-lg ${skinBorder} bg-[#14171c]`}>
              {s.board.map((cell, i) => {
                const isWinning = s.winningLine?.includes(i);
                const isShaking = s.shakingCell === i;
                return (
                  <button
                    key={i}
                    onClick={() => place(i)}
                    disabled={s.phase !== 'playing'}
                    className={`
                      w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center text-3xl font-mono font-bold rounded-md transition-all duration-100
                      ${cell ? 'bg-[#0b0d10]' : 'hover:bg-[#1a1d24] cursor-pointer'}
                      ${isWinning ? 'shadow-[0_0_15px_#ffd700] bg-[#1a1d24] text-yellow-400' : ''}
                      ${isShaking ? 'animate-[shake_0.3s_ease-in-out]' : ''}
                      ${!cell && s.phase === 'playing' ? 'active:scale-95' : ''}
                    `}
                  >
                    {cell}
                  </button>
                );
              })}
            </div>

            {s.phase === 'victory' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
                <Card className="p-6 flex flex-col items-center gap-4 bg-[#14171c] border border-[#4f8cff]">
                  <h3 className="text-xl font-bold text-yellow-400">Victory!</h3>
                  <p className="text-sm text-gray-300">{s.turn === 'X' ? 'You' : s.opponent} wins.</p>
                  <Button variant="primary" onClick={reset}>Play Again</Button>
                </Card>
              </div>
            )}

            {s.phase === 'draw' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
                <Card className="p-6 flex flex-col items-center gap-4 bg-[#14171c] border border-gray-600">
                  <h3 className="text-xl font-bold text-gray-300">Draw</h3>
                  <p className="text-sm text-gray-400">Grid full. No winner.</p>
                  <Button variant="secondary" onClick={reset}>Play Again</Button>
                </Card>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-gray-500 font-mono">
        v1.0.0 • TripleA Engine
      </footer>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
