"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Constants & Types ---
const STORAGE_KEYS = { MATCHES: 'gridstrike_matches', STATS: 'gridstrike_stats' };
const COLORS = {
  bg: '#0B0C10',
  surface: '#1F2833',
  primary: '#FF3E3E',
  secondary: '#4ECDC4',
  text: '#FFFFFF',
  muted: '#A0AAB5',
  border: '#2D3748'
};

type Match = { id: string; mode: string; winner: string | null; moves_count: number; duration_seconds: number; created_at: string };
type PlayerStats = { id: string; wins: number; losses: number; draws: number; current_streak: number; best_streak: number };
type CellState = 'X' | 'O' | null;
type GameMode = 'easy' | 'medium' | 'hard';

// --- Audio Engine ---
let audioCtx: AudioContext | null = null;
const getAudioCtx = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
};

const playPlaceSound = () => {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
};

const playWinSound = () => {
  const ctx = getAudioCtx();
  [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.3);
  });
};

const playDrawSound = () => {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
};

// --- Storage Helpers ---
const loadMatches = (): Match[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MATCHES);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};
const saveMatches = (matches: Match[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      const truncated = matches.slice(0, 40);
      localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(truncated));
    }
  }
};
const loadStats = (): PlayerStats => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STATS);
    return data ? JSON.parse(data) : { id: 'default', wins: 0, losses: 0, draws: 0, current_streak: 0, best_streak: 0 };
  } catch { return { id: 'default', wins: 0, losses: 0, draws: 0, current_streak: 0, best_streak: 0 }; }
};
const saveStats = (stats: PlayerStats) => {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch {}
};

// --- AI Logic ---
const checkWinner = (board: CellState[]): string | null => {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
};

const getAvailableMoves = (board: CellState[]): number[] => board.map((v, i) => v === null ? i : -1).filter(i => i !== -1);

const minimax = (board: CellState[], depth: number, isMaximizing: boolean): number => {
  const winner = checkWinner(board);
  if (winner === 'O') return 10 - depth;
  if (winner === 'X') return depth - 10;
  if (getAvailableMoves(board).length === 0) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (const i of getAvailableMoves(board)) {
      board[i] = 'O';
      best = Math.max(best, minimax(board, depth + 1, false));
      board[i] = null;
    }
    return best;
  } else {
    let best = Infinity;
    for (const i of getAvailableMoves(board)) {
      board[i] = 'X';
      best = Math.min(best, minimax(board, depth + 1, true));
      board[i] = null;
    }
    return best;
  }
};

const getAIMove = (board: CellState[], mode: GameMode): number => {
  const moves = getAvailableMoves(board);
  if (mode === 'easy') return moves[Math.floor(Math.random() * moves.length)];
  if (mode === 'medium') {
    for (const i of moves) {
      board[i] = 'O';
      if (checkWinner(board) === 'O') { board[i] = null; return i; }
      board[i] = null;
      board[i] = 'X';
      if (checkWinner(board) === 'X') { board[i] = null; return i; }
      board[i] = null;
    }
    return moves[Math.floor(Math.random() * moves.length)];
  }
  let bestScore = -Infinity;
  let bestMove = moves[0];
  for (const i of moves) {
    board[i] = 'O';
    let score = minimax(board, 0, false);
    board[i] = null;
    if (score > bestScore) { bestScore = score; bestMove = i; }
  }
  return bestMove;
};

// --- Particle System ---
const ParticleCanvas = ({ active, winner }: { active: boolean; winner: string | null }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; color: string }[]>([]);
  const animRef = useRef<number>();

  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    particlesRef.current = Array.from({ length: 100 }).map(() => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 1,
      color: winner === 'X' ? COLORS.primary : winner === 'O' ? COLORS.secondary : COLORS.muted
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.01;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      if (particlesRef.current.length > 0) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(animRef.current!);
      }
    };
    animate();
    return () => cancelAnimationFrame(animRef.current!);
  }, [active, winner]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
};

// --- Main Component ---
export default function GridStrikePage() {
  const [board, setBoard] = useState<CellState[]>(Array(9).fill(null));
  const [gameActive, setGameActive] = useState(false);
  const [mode, setMode] = useState<GameMode>('hard');
  const [history, setHistory] = useState<Match[]>([]);
  const [stats, setStats] = useState<PlayerStats>({ id: 'default', wins: 0, losses: 0, draws: 0, current_streak: 0, best_streak: 0 });
  const [soundOn, setSoundOn] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [shake, setShake] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const movesCountRef = useRef(0);

  useEffect(() => {
    setHistory(loadMatches());
    setStats(loadStats());
  }, []);

  useEffect(() => {
    const resumeAudio = () => { if (audioCtx?.state === 'suspended') audioCtx.resume(); };
    document.addEventListener('click', resumeAudio, { once: true });
    return () => document.removeEventListener('click', resumeAudio);
  }, []);

  const handleCellClick = useCallback((index: number) => {
    if (!gameActive || board[index] || aiThinking) return;
    
    if (soundOn) playPlaceSound();
    
    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    movesCountRef.current++;

    const win = checkWinner(newBoard);
    if (win) endGame(win);
    else if (!newBoard.includes(null)) endGame('draw');
    else {
      setAiThinking(true);
      setTimeout(() => {
        const aiMove = getAIMove(newBoard, mode);
        if (soundOn) playPlaceSound();
        const aiBoard = [...newBoard];
        aiBoard[aiMove] = 'O';
        setBoard(aiBoard);
        movesCountRef.current++;
        setAiThinking(false);
        
        const aiWin = checkWinner(aiBoard);
        if (aiWin) endGame(aiWin);
        else if (!aiBoard.includes(null)) endGame('draw');
      }, 600);
    }
  }, [board, gameActive, mode, soundOn, aiThinking]);

  const endGame = (result: string | null) => {
    setWinner(result);
    setGameActive(false);
    setShake(true);
    setTimeout(() => setShake(false), 300);
    
    if (soundOn) result === 'draw' ? playDrawSound() : playWinSound();

    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const newMatch: Match = {
      id: crypto.randomUUID(),
      mode,
      winner: result,
      moves_count: movesCountRef.current,
      duration_seconds: duration,
      created_at: new Date().toISOString()
    };

    const updatedHistory = [newMatch, ...history].slice(0, 50);
    setHistory(updatedHistory);
    saveMatches(updatedHistory);

    setStats(prev => {
      let s = { ...prev };
      if (result === 'X') { s.wins++; s.current_streak++; s.best_streak = Math.max(s.best_streak, s.current_streak); }
      else if (result === 'O') { s.losses++; s.current_streak = 0; }
      else { s.draws++; s.current_streak = 0; }
      saveStats(s);
      return s;
    });
  };

  const resetBoard = () => {
    setBoard(Array(9).fill(null));
    setGameActive(false);
    setWinner(null);
    movesCountRef.current = 0;
    startTimeRef.current = Date.now();
  };

  const startMatch = () => {
    resetBoard();
    setGameActive(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-2 gap-2 select-none" style={{ backgroundColor: COLORS.bg, color: COLORS.text, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap');
        .btn-hover:hover { transform: scale(1.02); }
        .btn-active:active { transform: scale(0.99); box-shadow: inset 1px 1px 2px rgba(0,0,0,0.5); }
        .cell-hover:hover { transform: scale(1.02); }
        .cell-active:active { transform: scale(0.98); box-shadow: inset 1px 1px 2px rgba(0,0,0,0.5); }
        .history-item { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .date-wrap { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(2px, 2px); }
          50% { transform: translate(-2px, -2px); }
          75% { transform: translate(2px, -2px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>

      <div className="w-full max-w-4xl flex justify-between items-center p-2">
        <button 
          data-testid="sound-toggle"
          onClick={() => setSoundOn(!soundOn)}
          className="btn-hover btn-active px-2 py-1 rounded text-sm font-medium transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
        >
          {soundOn ? '🔊 Sound On' : '🔇 Sound Off'}
        </button>
        <div data-testid="score-summary" className="flex gap-2 text-sm font-medium" style={{ color: COLORS.muted }}>
          <span>W: {stats.wins}</span>
          <span>L: {stats.losses}</span>
          <span>D: {stats.draws}</span>
          <span>Streak: {stats.current_streak}</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 w-full max-w-4xl items-start justify-center">
        <div className="flex flex-col items-center gap-2">
          {!gameActive && !winner && (
            <div data-testid="empty-history" className="text-center mb-2" style={{ color: COLORS.muted, fontSize: '16px' }}>
              No matches played yet
            </div>
          )}
          
          <div 
            className={`grid grid-cols-3 gap-2 p-2 rounded-lg transition-transform ${shake ? 'animate-shake' : ''}`}
            style={{ backgroundColor: COLORS.surface, border: `2px solid ${COLORS.border}` }}
          >
            {board.map((cell, i) => (
              <button
                key={i}
                data-testid={`cell-${i}`}
                data-marked={cell || undefined}
                onClick={() => handleCellClick(i)}
                disabled={!gameActive || !!cell || aiThinking}
                className="btn-hover cell-active w-20 h-20 flex items-center justify-center text-3xl font-bold rounded transition-all disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ 
                  backgroundColor: COLORS.bg, 
                  borderColor: COLORS.border, 
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  color: cell === 'X' ? COLORS.primary : COLORS.secondary,
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)'
                }}
              >
                {cell}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mt-2">
            {!gameActive ? (
              <button 
                data-testid="start-match-btn"
                onClick={startMatch}
                className="btn-hover btn-active px-4 py-2 rounded font-bold text-white transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: COLORS.primary }}
              >
                Start Match
              </button>
            ) : (
              <button 
                data-testid="reset-board-btn"
                onClick={resetBoard}
                className="btn-hover btn-active px-4 py-2 rounded font-bold text-white transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: COLORS.border }}
              >
                Reset Board
              </button>
            )}
            
            <select 
              value={mode} 
              onChange={(e) => setMode(e.target.value as GameMode)}
              disabled={gameActive}
              className="btn-hover px-2 py-2 rounded text-sm font-medium focus:outline-none focus:ring-2"
              style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="w-full md:w-64 p-2 rounded-lg" style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          <h3 className="text-sm font-bold mb-2" style={{ color: COLORS.muted }}>Match History</h3>
          <div data-testid="match-history-list" className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {history.length === 0 ? (
              <div data-testid="empty-history" className="text-sm italic" style={{ color: COLORS.muted }}>No matches played yet</div>
            ) : (
              history.map(m => (
                <div key={m.id} className="p-2 rounded text-xs" style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                  <div className="flex justify-between mb-1">
                    <span className="font-bold" style={{ color: m.winner === 'X' ? COLORS.primary : m.winner === 'O' ? COLORS.secondary : COLORS.muted }}>
                      {m.winner ? `${m.winner} Wins` : 'Draw'}
                    </span>
                    <span style={{ color: COLORS.muted }}>{m.mode}</span>
                  </div>
                  <div className="history-item" title={`${m.moves_count} moves • ${m.duration_seconds}s`}>
                    {m.moves_count} moves • {m.duration_seconds}s
                  </div>
                  <div className="date-wrap mt-1" style={{ color: COLORS.muted }}>
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {winner && (
        <div data-testid="win-banner" className="fixed inset-0 flex items-center justify-center bg-black/50 z-40 backdrop-blur-sm">
          <div className="p-6 rounded-xl text-center shadow-2xl" style={{ backgroundColor: COLORS.surface, border: `2px solid ${COLORS.border}` }}>
            <h2 className="text-3xl font-extrabold mb-2" style={{ color: winner === 'X' ? COLORS.primary : winner === 'O' ? COLORS.secondary : COLORS.muted }}>
              {winner === 'draw' ? 'Draw!' : `${winner} Wins!`}
            </h2>
            <p className="mb-4" style={{ color: COLORS.muted }}>Great game!</p>
            <button 
              onClick={startMatch}
              className="btn-hover btn-active px-6 py-2 rounded font-bold text-white transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: COLORS.primary }}
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      <ParticleCanvas active={!!winner} winner={winner} />
    </div>
  );
}