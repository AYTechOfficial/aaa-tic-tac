'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Card } from '@/components/ui';
import { useStore } from '@/lib/store';

type Player = 'X' | 'O';
type Cell = Player | null;
type Board = Cell[];
type GameMode = 'single' | 'passplay';
type Difficulty = 'easy' | 'medium' | 'hard';
type MatchHistory = { id: string; mode: GameMode; winner: Player | null; played_at: string };

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWinner(board: Board): { winner: Player | null, line: number[] | null } {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: combo };
    }
  }
  return { winner: null, line: null };
}

function getBestMove(board: Board, aiPlayer: Player): number {
  const emptyIndices = board.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
  for (const idx of emptyIndices) {
    const tempBoard = [...board];
    tempBoard[idx] = aiPlayer;
    if (checkWinner(tempBoard).winner === aiPlayer) return idx;
  }
  const opponent = aiPlayer === 'X' ? 'O' : 'X';
  for (const idx of emptyIndices) {
    const tempBoard = [...board];
    tempBoard[idx] = opponent;
    if (checkWinner(tempBoard).winner === opponent) return idx;
  }
  if (board[4] === null) return 4;
  return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

export default function Home() {
  const { profile, addPoints, matchHistory, setMatchHistory } = useStore();
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>('single');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [winner, setWinner] = useState<Player | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [draw, setDraw] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [sessionScore, setSessionScore] = useState(0);
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentPlayer = isXNext ? 'X' : 'O';

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const themeId = customEvent.detail;
      const gameBoard = document.getElementById('game-board');
      if (gameBoard) {
        gameBoard.className = '';
        if (themeId === 'neon-highway') {
          gameBoard.classList.add('border-[var(--accent)]', 'shadow-[0_0_15px_var(--accent)]', 'theme-neon');
        } else if (themeId === 'desert-route66') {
          gameBoard.classList.add('border-amber-500', 'bg-amber-900/10');
        }
      }
    };
    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, []);

  const playSound = (type: 'move' | 'win' | 'reset') => {
    if (!audioEnabled) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'move') {
      osc.frequency.value = 400;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'win') {
      osc.frequency.value = 600;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else {
      osc.frequency.value = 200;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  };

  const handleClick = (index: number) => {
    if (board[index] || winner || draw) return;
    if (gameMode === 'single' && !isXNext) return;
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    playSound('move');
    const result = checkWinner(newBoard);
    if (result.winner) {
      setWinner(result.winner);
      setWinningLine(result.line);
      setShowModal(true);
      addPoints(100);
      setSessionScore(s => s + 100);
      setMatchHistory(prev => [...prev, { id: crypto.randomUUID(), mode: gameMode, winner: result.winner, played_at: new Date().toISOString() } as MatchHistory]);
    } else if (newBoard.every(cell => cell !== null)) {
      setDraw(true);
      setShowModal(true);
    } else {
      setIsXNext(!isXNext);
    }
  };

  useEffect(() => {
    if (gameMode === 'single' && !isXNext && !winner && !draw) {
      aiTimeoutRef.current = setTimeout(() => {
        let moveIndex: number;
        if (difficulty === 'easy') {
          const empty = board.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
          moveIndex = empty[Math.floor(Math.random() * empty.length)];
        } else if (difficulty === 'medium') {
          moveIndex = Math.random() > 0.5 ? getBestMove(board, 'O') : board.map((v, i) => v === null ? i : null).filter(v => v !== null)[Math.floor(Math.random() * board.filter(c => c === null).length)];
        } else {
          moveIndex = getBestMove(board, 'O');
        }
        if (moveIndex !== undefined) {
          const newBoard = [...board];
          newBoard[moveIndex] = 'O';
          setBoard(newBoard);
          playSound('move');
          const result = checkWinner(newBoard);
          if (result.winner) {
            setWinner(result.winner);
            setWinningLine(result.line);
            setShowModal(true);
            addPoints(100);
            setSessionScore(s => s + 100);
            setMatchHistory(prev => [...prev, { id: crypto.randomUUID(), mode: 'single', winner: result.winner, played_at: new Date().toISOString() } as MatchHistory]);
          } else if (newBoard.every(cell => cell !== null)) {
            setDraw(true);
            setShowModal(true);
          } else {
            setIsXNext(true);
          }
        }
      }, 600);
    }
    return () => { if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current); };
  }, [isXNext, gameMode, difficulty, board, winner, draw, addPoints, setMatchHistory]);

  const resetBoard = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
    setDraw(false);
    setShowModal(false);
    playSound('reset');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--primary)] p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--accent)]">AAA Roadside XO</h1>
          <p className="text-sm text-[var(--secondary)]">Tow Trucks vs. Service Sedans</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--secondary)]">Points:</span>
            <span data-testid="rewards-points" className="font-mono font-bold text-[var(--accent)]">{profile.points_balance}</span>
          </div>
          <button onClick={() => setAudioEnabled(!audioEnabled)} className={`p-2 rounded-lg transition-colors ${audioEnabled ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-white/5 text-[var(--secondary)]'}`} aria-label="Toggle audio">
            {audioEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </header>
      <main className="w-full max-w-4xl flex flex-col gap-6">
        <Card className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <Button variant={gameMode === 'single' ? 'primary' : 'secondary'} onClick={() => { setGameMode('single'); resetBoard(); }}>Single Player</Button>
            <Button variant={gameMode === 'passplay' ? 'primary' : 'secondary'} onClick={() => { setGameMode('passplay'); resetBoard(); }}>Pass & Play</Button>
          </div>
          {gameMode === 'single' && (
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="rounded-lg border border-white/10 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--primary)] focus:border-[var(--accent)] focus:outline-none">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Minimax Hard</option>
            </select>
          )}
        </Card>
        <div className="flex justify-between items-center mb-2">
          <span data-testid="turn-indicator" className="text-lg font-medium text-[var(--primary)]">
            {winner ? 'Game Over' : draw ? 'Draw!' : `${isXNext ? 'Player 1 (Tow Truck)' : 'Player 2 (Service Sedan)'}'s Turn`}
          </span>
          <span data-testid="session-score" className="text-sm text-[var(--secondary)]">Session Score: {sessionScore}</span>
        </div>
        <div id="game-board" className="grid grid-cols-3 gap-2 w-full max-w-md aspect-square bg-[var(--surface)] p-2 rounded-xl border border-white/10 shadow-lg">
          {board.map((cell, index) => (
            <button key={index} data-testid={`cell-${index}-${currentPlayer.toLowerCase()}`} onClick={() => handleClick(index)} disabled={!!cell || !!winner || !!draw || (gameMode === 'single' && !isXNext)} className="relative flex items-center justify-center text-4xl font-bold rounded-lg bg-white/[0.02] hover:bg-white/5 transition-all disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
              {cell === 'X' && <span className="text-[var(--accent)]">🚛</span>}
              {cell === 'O' && <span className="text-blue-400">🚗</span>}
              {winningLine?.includes(index) && !cell && <div className="absolute inset-0 bg-[var(--accent)]/20 rounded-lg animate-pulse" />}
            </button>
          ))}
        </div>
        <div className="flex justify-center mt-4">
          <Button onClick={resetBoard} variant="outline" size="lg">Reset Board</Button>
        </div>
      </main>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-sm w-full text-center p-8 space-y-6">
            <div className="text-5xl mb-4">{winner ? '🏆' : '🤝'}</div>
            <h2 className="text-2xl font-bold text-[var(--primary)]">{winner ? 'AAA Roadside Victory!' : "It's a Draw!"}</h2>
            <p className="text-[var(--secondary)]">{winner ? `Player ${winner === 'X' ? '1' : '2'} wins and earns 100 points!` : 'Great game! No points awarded.'}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setShowModal(false)} variant="secondary">Close</Button>
              <Button onClick={resetBoard} variant="primary">Play Again</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}