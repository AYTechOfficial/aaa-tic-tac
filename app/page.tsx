"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, EmptyState, ListRow } from '@/components/ui';

type Record = { id: string; title: string; notes: string; createdAt: string };
type Board = (string | null)[];

const STORAGE_KEY = "lastmile:aaa-tic-tac:match_history";
const WIN_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

export default function GridStrikePage() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [status, setStatus] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [history, setHistory] = useState<Record[]>([]);
  const [scores, setScores] = useState({ wins: 0, losses: 0, draws: 0 });
  const [aiMode, setAiMode] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) { console.error(e); }
  }, [history]);

  useEffect(() => {
    let w = 0, l = 0, d = 0;
    history.forEach(rec => {
      if (rec.title.toLowerCase().includes('win')) w++;
      else if (rec.title.toLowerCase().includes('loss')) l++;
      else d++;
    });
    setScores({ wins: w, losses: l, draws: d });
  }, [history]);

  const playBeep = useCallback((freq = 440, dur = 0.1) => {
    if (!soundOn) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {}
  }, [soundOn]);

  const checkEnd = useCallback((currentBoard: Board) => {
    for (const combo of WIN_COMBOS) {
      const [a, b, c] = combo;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return currentBoard[a];
      }
    }
    if (currentBoard.every(cell => cell !== null)) return 'draw';
    return null;
  }, []);

  const handleCellClick = useCallback((index: number) => {
    if (board[index] || status !== 'playing') return;
    if (aiMode && turn === 'O') return;

    const newBoard = [...board];
    newBoard[index] = turn;
    setBoard(newBoard);
    playBeep(turn === 'X' ? 600 : 400, 0.1);

    const result = checkEnd(newBoard);
    if (result) {
      setStatus('ended');
      setWinner(result);
      finalizeMatch(result);
    } else {
      setTurn(prev => prev === 'X' ? 'O' : 'X');
    }
  }, [board, status, turn, aiMode, checkEnd, playBeep]);

  useEffect(() => {
    if (aiMode && turn === 'O' && status === 'playing') {
      const timer = setTimeout(() => {
        const emptyIndices = board.map((v, i) => v === null ? i : -1).filter(i => i !== -1);
        if (emptyIndices.length > 0) {
          const randIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          handleCellClick(randIdx);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [turn, status, aiMode, board, handleCellClick]);

  const finalizeMatch = useCallback((result: string | 'draw') => {
    const isWin = result === 'X';
    const isLoss = result === 'O';
    const title = isWin ? 'Victory' : isLoss ? 'Defeat' : 'Draw';
    const note = `${isWin ? 'Won' : isLoss ? 'Lost' : 'Drew'} against ${aiMode ? 'AI' : 'Opponent'}`;
    const record: Record = {
      id: crypto.randomUUID(),
      title,
      notes: note,
      createdAt: new Date().toISOString()
    };
    setHistory(prev => [record, ...prev]);
    playBeep(isWin ? 800 : 300, 0.2);
  }, [aiMode, playBeep]);

  const startMatch = () => {
    setBoard(Array(9).fill(null));
    setStatus('playing');
    setTurn('X');
    setWinner(null);
    playBeep(500, 0.1);
  };

  const resetBoard = () => {
    setBoard(Array(9).fill(null));
    setStatus('idle');
    setTurn('X');
    setWinner(null);
    playBeep(300, 0.1);
  };

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e6e9ef] p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between border-b border-[#14171c] pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-[#e6e9ef]">GRIDSTRIKE <span className="text-[#4f8cff]">AAA</span></h1>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setAiMode(p => !p)} className="font-mono text-xs">
              AI MODE: {aiMode ? 'ON' : 'OFF'}
            </Button>
            <Button variant="secondary" onClick={() => setSoundOn(p => !p)} className="font-mono text-xs">
              SOUND: {soundOn ? 'ON' : 'OFF'}
            </Button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-4">
            <Card className="p-6 bg-[#14171c] border border-[#14171c]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-mono text-[#4f8cff] uppercase tracking-widest">Arena</span>
                <span className="text-xs font-mono text-[#e6e9ef]/60">{status === 'playing' ? `TURN: ${turn}` : status === 'ended' ? 'MATCH ENDED' : 'READY'}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 aspect-square max-w-md mx-auto">
                {board.map((cell, i) => (
                  <button
                    key={i}
                    data-testid={`cell-${i}`}
                    data-marked={cell}
                    disabled={!!cell || status !== 'playing' || (aiMode && turn === 'O')}
                    onClick={() => handleCellClick(i)}
                    className="w-full h-full flex items-center justify-center bg-[#0b0d10] border border-[#14171c] hover:border-[#4f8cff] transition-colors rounded-sm cursor-pointer disabled:cursor-default"
                  >
                    {cell && (
                      <span className={`text-4xl font-mono font-bold ${cell === 'X' ? 'text-[#4f8cff]' : 'text-[#e6e9ef]/80'}`}>
                        {cell}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex gap-3 justify-center">
                <Button data-testid="start-match-btn" onClick={startMatch} className="px-6 py-2 bg-[#4f8cff] text-[#0b0d10] font-mono font-bold hover:bg-[#4f8cff]/90">
                  START MATCH
                </Button>
                <Button data-testid="reset-board-btn" onClick={resetBoard} variant="outline" className="px-6 py-2 font-mono">
                  RESET BOARD
                </Button>
              </div>
            </Card>

            {status === 'ended' && (
              <div data-testid="win-banner" className="p-4 bg-[#14171c] border-l-4 border-[#4f8cff] flex items-center justify-between">
                <div>
                  <span className="block text-xs font-mono text-[#4f8cff] uppercase">Result</span>
                  <span className="text-xl font-bold text-[#e6e9ef]">
                    {winner === 'X' ? 'VICTORY' : winner === 'O' ? 'DEFEAT' : 'DRAW'}
                  </span>
                </div>
                <Button onClick={startMatch} className="font-mono text-sm">PLAY AGAIN</Button>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <Card className="p-4 bg-[#14171c] border border-[#14171c]">
              <h2 className="text-sm font-mono text-[#4f8cff] uppercase tracking-widest mb-3">Score Summary</h2>
              <div data-testid="score-summary" className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-[#0b0d10] rounded-sm">
                  <span className="block text-lg font-mono font-bold text-[#4f8cff]">{scores.wins}</span>
                  <span className="text-[10px] font-mono text-[#e6e9ef]/60 uppercase">Wins</span>
                </div>
                <div className="p-2 bg-[#0b0d10] rounded-sm">
                  <span className="block text-lg font-mono font-bold text-[#e6e9ef]/80">{scores.losses}</span>
                  <span className="text-[10px] font-mono text-[#e6e9ef]/60 uppercase">Losses</span>
                </div>
                <div className="p-2 bg-[#0b0d10] rounded-sm">
                  <span className="block text-lg font-mono font-bold text-[#e6e9ef]/80">{scores.draws}</span>
                  <span className="text-[10px] font-mono text-[#e6e9ef]/60 uppercase">Draws</span>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-[#14171c] border border-[#14171c] flex flex-col min-h-[300px]">
              <h2 className="text-sm font-mono text-[#4f8cff] uppercase tracking-widest mb-3">Match History</h2>
              <div className="flex-1 overflow-y-auto pr-1">
                {history.length === 0 ? (
                  <EmptyState data-testid="empty-history" title="No matches played yet" description="Complete a game to see it logged here." />
                ) : (
                  <div data-testid="match-history-list" className="space-y-2">
                    {history.map((rec) => (
                      <ListRow key={rec.id} className="p-3 bg-[#0b0d10] border border-[#14171c]">
                        <div className="flex justify-between items-start w-full">
                          <div>
                            <span className="block text-sm font-mono font-bold text-[#e6e9ef]">{rec.title}</span>
                            <span className="block text-xs font-mono text-[#e6e9ef]/60 truncate max-w-[200px]" title={rec.notes}>{rec.notes}</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#4f8cff] whitespace-nowrap ml-2">{new Date(rec.createdAt).toLocaleDateString()}</span>
                        </div>
                      </ListRow>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </aside>
        </main>
      </div>
    </div>
  );
}