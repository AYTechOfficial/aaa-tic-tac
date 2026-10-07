"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Badge, EmptyState, ListRow } from '@/components/ui';

type Record = { id: string; title: string; notes: string; createdAt: string };
type BoardState = (string | null)[];
type Player = 'X' | 'O';
type Difficulty = 'easy' | 'medium' | 'hard';
type ThemeId = 'default' | 'neon-highway';

interface ProfileData {
  rewardsPoints: number;
  unlockedThemes: ThemeId[];
  activeTheme?: ThemeId;
  sessionScores: { p1: number; p2: number };
}

const STORAGE_KEY = "lastmile:aaa-tic-tac:profiles";
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const TowTruckIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const ServiceSedanIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M5 13l4 4L19 7" />
  </svg>
);

function evaluate(board: BoardState): number {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] === 'O' ? 10 : -10;
    }
  }
  return 0;
}

function isMovesLeft(board: BoardState): boolean {
  return board.some(cell => cell === null);
}

function minimax(board: BoardState, depth: number, isMaximizing: boolean): number {
  const score = evaluate(board);
  if (score !== 0) return score;
  if (!isMovesLeft(board)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        best = Math.max(best, minimax(board, depth + 1, false));
        board[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'X';
        best = Math.min(best, minimax(board, depth + 1, true));
        board[i] = null;
      }
    }
    return best;
  }
}

function getHardMove(board: BoardState): number {
  let bestVal = -Infinity;
  let bestMove = -1;
  const boardCopy = [...board];
  for (let i = 0; i < 9; i++) {
    if (boardCopy[i] === null) {
      boardCopy[i] = 'O';
      const moveVal = minimax(boardCopy, 0, false);
      boardCopy[i] = null;
      if (moveVal > bestVal) {
        bestMove = i;
        bestVal = moveVal;
      }
    }
  }
  return bestMove;
}

function getMediumMove(board: BoardState): number {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] === 'O' && board[b] === 'O' && board[c] === null) return c;
    if (board[a] === 'O' && board[c] === 'O' && board[b] === null) return b;
    if (board[b] === 'O' && board[c] === 'O' && board[a] === null) return a;
  }
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] === 'X' && board[b] === 'X' && board[c] === null) return c;
    if (board[a] === 'X' && board[c] === 'X' && board[b] === null) return b;
    if (board[b] === 'X' && board[c] === 'X' && board[a] === null) return a;
  }
  const emptyIndices = board.map((v, i) => v === null ? i : -1).filter(i => i !== -1);
  return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

function getEasyMove(board: BoardState): number {
  const emptyIndices = board.map((v, i) => v === null ? i : -1).filter(i => i !== -1);
  return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

export default function AAARoadsideWidgets() {
  const [profile, setProfile] = useState<ProfileData>({
    rewardsPoints: 0,
    unlockedThemes: [],
    activeTheme: undefined,
    sessionScores: { p1: 0, p2: 0 }
  });
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [mode, setMode] = useState<'single' | 'passplay'>('single');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [isAITurn, setIsAITurn] = useState(false);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [view, setView] = useState<'game' | 'rewards'>('game');
  const [memberId, setMemberId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setProfile(prev => ({ ...prev, ...parsed }));
      }
    } catch {
      setError("Failed to load saved progress. Starting fresh.");
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      setError("Failed to save progress. Storage might be full.");
    }
  }, [profile]);

  const checkResult = useCallback((newBoard: BoardState): Player | 'draw' | null => {
    for (const [a, b, c] of WIN_LINES) {
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        return newBoard[a] as Player;
      }
    }
    return newBoard.every(Boolean) ? 'draw' : null;
  }, []);

  const handleCellClick = (index: number) => {
    if (board[index] || isAITurn || winner) return;
    if (mode === 'single' && currentPlayer === 'O') return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const result = checkResult(newBoard);
    if (result) {
      setWinner(result);
      if (result === 'X') {
        setProfile(p => ({ ...p, sessionScores: { ...p.sessionScores, p1: p.sessionScores.p1 + 100 } }));
      } else {
        setProfile(p => ({ ...p, sessionScores: { ...p.sessionScores, p2: p.sessionScores.p2 + 100 } }));
      }
      return;
    }

    if (mode === 'passplay') {
      setCurrentPlayer(prev => prev === 'X' ? 'O' : 'X');
    } else {
      setIsAITurn(true);
    }
  };

  useEffect(() => {
    if (mode === 'single' && isAITurn && !winner) {
      const timer = setTimeout(() => {
        const move = difficulty === 'hard' ? getHardMove(board)
          : difficulty === 'medium' ? getMediumMove(board)
          : getEasyMove(board);
        
        if (move !== -1) {
          const newBoard = [...board];
          newBoard[move] = 'O';
          setBoard(newBoard);
          const result = checkResult(newBoard);
          if (result) {
            setWinner(result);
            if (result === 'O') {
              setProfile(p => ({ ...p, sessionScores: { ...p.sessionScores, p2: p.sessionScores.p2 + 100 } }));
            }
          } else {
            setIsAITurn(false);
          }
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isAITurn, mode, board, difficulty, winner, checkResult]);

  const resetBoard = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setIsAITurn(false);
  };

  const applyMemberBonus = () => {
    if (memberId.trim().length >= 10) {
      setProfile(p => ({ ...p, rewardsPoints: p.rewardsPoints + 500 }));
      setMemberId('');
      setError(null);
    } else {
      setError("Invalid Member ID format. Please enter a valid ID.");
    }
  };

  const unlockTheme = (themeId: ThemeId, cost: number) => {
    if (profile.unlockedThemes.includes(themeId)) return;
    if (profile.rewardsPoints < cost) {
      setError("Insufficient points to unlock this theme.");
      return;
    }
    setProfile(p => ({
      ...p,
      rewardsPoints: p.rewardsPoints - cost,
      unlockedThemes: [...p.unlockedThemes, themeId]
    }));
    setError(null);
  };

  const equipTheme = (themeId: ThemeId) => {
    if (!profile.unlockedThemes.includes(themeId)) return;
    setProfile(p => ({ ...p, activeTheme: themeId }));
  };

  const currentThemeClass = profile.activeTheme === 'neon-highway' ? 'theme-neon' : '';

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e6e9ef] font-sans selection:bg-[#4f8cff] selection:text-[#0b0d10]">
      <header className="sticky top-0 z-10 border-b border-[#14171c] bg-[#0b0d10]/90 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge tone="brand">AAA Roadside XO</Badge>
          <span className="text-xs font-mono text-[#4f8cff] tracking-wider">v1.0.4</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-[#e6e9ef]/60">Rewards</span>
            <span data-testid="rewards-points" className="font-mono text-lg font-bold text-[#4f8cff]">
              {profile.rewardsPoints}
            </span>
          </div>
          <nav className="flex gap-2">
            <Button variant={view === 'game' ? 'primary' : 'ghost'} size="sm" onClick={() => setView('game')}>
              Game
            </Button>
            <Button variant={view === 'rewards' ? 'primary' : 'ghost'} size="sm" onClick={() => setView('rewards')}>
              Rewards
            </Button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {error && (
          <div className="p-3 rounded border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-mono">
            {error}
          </div>
        )}

        {view === 'game' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-4 bg-[#14171c] border-[#14171c]">
                <div className="flex items-center justify-between mb-4">
                  <div data-testid="turn-indicator" className="font-mono text-sm">
                    {winner ? 'Game Over' : `${mode === 'passplay' ? `Player ${currentPlayer === 'X' ? '1' : '2'}` : 'Your Turn'} (${currentPlayer === 'X' ? 'Tow Truck' : 'Service Sedan'})`}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={mode}
                      onChange={(e) => { setMode(e.target.value as 'single' | 'passplay'); resetBoard(); }}
                      className="bg-[#0b0d10] border border-[#14171c] rounded px-2 py-1 text-xs font-mono text-[#e6e9ef]"
                    >
                      <option value="single">Single Player</option>
                      <option value="passplay">Pass & Play</option>
                    </select>
                    {mode === 'single' && (
                      <select
                        value={difficulty}
                        onChange={(e) => { setDifficulty(e.target.value as Difficulty); resetBoard(); }}
                        className="bg-[#0b0d10] border border-[#14171c] rounded px-2 py-1 text-xs font-mono text-[#e6e9ef]"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    )}
                  </div>
                </div>
                <div id="game-board" className={`grid grid-cols-3 gap-2 aspect-square max-w-md mx-auto ${currentThemeClass}`}>
                  {board.map((cell, i) => (
                    <button
                      key={i}
                      data-testid={`cell-${i}-${cell?.toLowerCase()}`}
                      onClick={() => handleCellClick(i)}
                      disabled={!!cell || isAITurn || !!winner}
                      className={`
                        flex items-center justify-center rounded bg-[#0b0d10] border border-[#14171c] transition-all duration-200
                        hover:border-[#4f8cff] hover:bg-[#14171c] disabled:cursor-not-allowed disabled:hover:border-[#14171c] disabled:hover:bg-[#0b0d10]
                        ${currentThemeClass === 'theme-neon' ? 'shadow-[0_0_10px_rgba(79,140,255,0.3)] border-[#4f8cff]/50' : ''}
                      `}
                    >
                      {cell === 'X' && <TowTruckIcon />}
                      {cell === 'O' && <ServiceSedanIcon />}
                    </button>
                  ))}
                </div>
              </Card>
              <div className="flex justify-between items-center">
                <div data-testid="session-score" className="font-mono text-sm text-[#e6e9ef]/70">
                  Session Score: P1 {profile.sessionScores.p1} | P2 {profile.sessionScores.p2}
                </div>
                <Button variant="outline" size="sm" onClick={resetBoard}>
                  Reset Board
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="p-4 bg-[#14171c] border-[#14171c]">
                <h3 className="text-sm font-mono uppercase tracking-widest text-[#e6e9ef]/60 mb-3">Active Theme</h3>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded ${profile.activeTheme === 'neon-highway' ? 'bg-[#4f8cff]' : 'bg-[#1a1e25]'}`} />
                  <span className="text-sm font-mono text-[#e6e9ef]">
                    {profile.activeTheme === 'neon-highway' ? 'Neon Highway' : 'Default'}
                  </span>
                </div>
              </Card>
              <Card className="p-4 bg-[#14171c] border-[#14171c]">
                <h3 className="text-sm font-mono uppercase tracking-widest text-[#e6e9ef]/60 mb-3">Controls</h3>
                <div className="space-y-2 text-xs font-mono text-[#e6e9ef]/70">
                  <p>• Select mode & difficulty above</p>
                  <p>• Click cells to place marks</p>
                  <p>• AI responds within 600ms</p>
                  <p>• Wins award 100 session points</p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {view === 'rewards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-[#14171c] border-[#14171c]">
              <h2 className="text-lg font-mono text-[#e6e9ef] mb-4">Redeem Member Bonus</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    placeholder="Enter AAA Member ID"
                    className="flex-1 bg-[#0b0d10] border border-[#14171c] rounded px-3 py-2 text-sm font-mono text-[#e6e9ef] placeholder:text-[#e6e9ef]/30 focus:outline-none focus:border-[#4f8cff]"
                  />
                  <Button variant="primary" size="md" onClick={applyMemberBonus}>
                    Enter AAA Member ID
                  </Button>
                </div>
                <p className="text-xs font-mono text-[#e6e9ef]/50">Validates membership and awards 500 bonus points instantly.</p>
              </div>
            </Card>

            <Card className="p-6 bg-[#14171c] border-[#14171c]">
              <h2 className="text-lg font-mono text-[#e6e9ef] mb-4">Theme Store</h2>
              {!profile.unlockedThemes.length ? (
                <EmptyState
                  title="No Unlocked Themes"
                  message="Play games or redeem member bonuses to earn points."
                  description="Browse the catalog below to find your next look."
                  action={<Button variant="primary" size="sm" onClick={() => setView('game')}>Start Playing</Button>}
                />
              ) : (
                <div className="space-y-3">
                  {profile.unlockedThemes.map(theme => (
                    <ListRow
                      key={theme}
                      title={theme === 'neon-highway' ? 'Neon Highway' : 'Default'}
                      subtitle={theme === 'neon-highway' ? 'Glowing accents, high contrast' : 'Clean engineering baseline'}
                      trailing={
                        <Button
                          variant={profile.activeTheme === theme ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => equipTheme(theme)}
                        >
                          {profile.activeTheme === theme ? 'Equipped' : 'Equip Theme'}
                        </Button>
                      }
                    />
                  ))}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-[#14171c]">
                <ListRow
                  title="Neon Highway Theme"
                  subtitle="Cost: 300 points"
                  trailing={
                    profile.unlockedThemes.includes('neon-highway') ? (
                      <Badge tone="pass">Owned</Badge>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={profile.rewardsPoints < 300}
                        onClick={() => unlockTheme('neon-highway', 300)}
                      >
                        Unlock
                      </Button>
                    )
                  }
                />
              </div>
            </Card>
          </div>
        )}
      </main>

      {winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0d10]/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-8 bg-[#14171c] border-[#14171c] text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#4f8cff]/10 text-[#4f8cff] mb-2">
              <TowTruckIcon />
            </div>
            <h2 className="text-2xl font-mono text-[#e6e9ef]">
              {winner === 'draw' ? 'Grid Locked' : 'AAA Roadside Victory!'}
            </h2>
            <p className="text-sm text-[#e6e9ef]/70 font-mono">
              {winner === 'draw'
                ? 'Perfect defense. No moves remaining.'
                : `Player ${winner === 'X' ? '1' : '2'} secured the route. +100 points added.`}
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" size="md" onClick={resetBoard}>
                Play Again
              </Button>
              <Button variant="primary" size="md" onClick={() => setView('rewards')}>
                Claim Rewards
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}