"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Card, Badge, EmptyState } from "@/components/ui";

// ─── Types ───────────────────────────────────────────────────────────────────
type CellValue = "X" | "O" | null;
type Board = CellValue[];
type GameMode = "single" | "passplay";
type Difficulty = "easy" | "medium" | "hard";
type GameState = "playing" | "won" | "draw";

interface Profile {
  rewardsPoints: number;
  unlockedThemes: string[];
  currentTheme: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const STORAGE_KEY = "lastmile:aaa-tic-tac:profiles";

const DEFAULT_PROFILE: Profile = {
  rewardsPoints: 0,
  unlockedThemes: [],
  currentTheme: "",
};

const WIN_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const THEMES = [
  { id: "neon-highway", name: "Neon Highway", cost: 300, desc: "Glowing neon accents" },
  { id: "midnight-drive", name: "Midnight Drive", cost: 500, desc: "Deep blue tones" },
  { id: "desert-storm", name: "Desert Storm", cost: 700, desc: "Warm desert palette" },
];

// ─── Icons ───────────────────────────────────────────────────────────────────
const TowTruckIcon = ({ size = 32 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="4" y="20" width="4" height="4" rx="1" fill="#4f8cff" />
    <rect x="8" y="16" width="8" height="8" rx="1" fill="#4f8cff" />
    <rect x="16" y="12" width="8" height="12" rx="1" fill="#4f8cff" />
    <circle cx="6" cy="26" r="2" fill="#e6e9ef" />
    <circle cx="20" cy="26" r="2" fill="#e6e9ef" />
    <path d="M24 12 L28 8 V12 H24 Z" fill="#e6e9ef" />
  </svg>
);

const ServiceSedanIcon = ({ size = 32 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="6" y="16" width="20" height="4" rx="1" fill="#4f8cff" />
    <rect x="10" y="12" width="12" height="4" rx="1" fill="#4f8cff" />
    <circle cx="10" cy="22" r="2" fill="#e6e9ef" />
    <circle cx="22" cy="22" r="2" fill="#e6e9ef" />
    <path d="M12 12 L14 8 H18 L20 12 H12 Z" fill="#e6e9ef" />
  </svg>
);

// ─── Persistence ─────────────────────────────────────────────────────────────
function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Profile;
      if (parsed && typeof parsed.rewardsPoints === "number") {
        return parsed;
      }
    }
  } catch {
    // Storage corrupted — fall through to defaults
  }
  return { ...DEFAULT_PROFILE };
}

function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Quota exceeded or private browsing — silently ignore
  }
}

// ─── Game Logic ──────────────────────────────────────────────────────────────
function checkWinner(board: Board): { winner: CellValue; line: number[] | null } {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return { winner: null, line: null };
}

function isBoardFull(board: Board): boolean {
  return board.every((c) => c !== null);
}

function getEmptyCells(board: Board): number[] {
  const empty: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (!board[i]) empty.push(i);
  }
  return empty;
}

function getRandomMove(board: Board): number {
  const empty = getEmptyCells(board);
  return empty[Math.floor(Math.random() * empty.length)];
}

function getBestMove(board: Board, player: CellValue): number {
  const opponent = player === "X" ? "O" : "X";

  function minimax(b: Board, depth: number, maximizing: boolean): number {
    const result = checkWinner(b);
    if (result.winner === player) return 10 - depth;
    if (result.winner === opponent) return depth - 10;
    if (isBoardFull(b)) return 0;

    if (maximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!b[i]) {
          b[i] = player;
          best = Math.max(best, minimax(b, depth + 1, false));
          b[i] = null;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!b[i]) {
          b[i] = opponent;
          best = Math.min(best, minimax(b, depth + 1, true));
          b[i] = null;
        }
      }
      return best;
    }
  }

  let bestScore = -Infinity;
  let bestMove = -1;
  const empty = getEmptyCells(board);

  for (const idx of empty) {
    board[idx] = player;
    const score = minimax(board, 0, false);
    board[idx] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = idx;
    }
  }

  return bestMove;
}

function getAIMove(board: Board, difficulty: Difficulty, aiPlayer: CellValue): number {
  switch (difficulty) {
    case "easy":
      return getRandomMove(board);
    case "medium":
      return Math.random() < 0.6 ? getBestMove([...board], aiPlayer) : getRandomMove(board);
    case "hard":
      return getBestMove([...board], aiPlayer);
    default:
      return getRandomMove(board);
  }
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X");
  const [gameMode, setGameMode] = useState<GameMode>("single");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [gameState, setGameState] = useState<GameState>("playing");
  const [winner, setWinner] = useState<CellValue>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [memberIdInput, setMemberIdInput] = useState("");
  const [memberIdError, setMemberIdError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved profile on mount
  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  // Persist profile whenever it changes
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  // Show toast helper
  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // AI turn effect
  useEffect(() => {
    if (
      gameMode === "single" &&
      currentPlayer === "O" &&
      gameState === "playing" &&
      !aiThinking
    ) {
      setAiThinking(true);
      const timer = setTimeout(() => {
        const move = getAIMove(board, difficulty, "O");
        if (move !== -1) {
          makeMove(move);
        }
        setAiThinking(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameMode, gameState, aiThinking, board, difficulty]);

  // Win / draw detection
  useEffect(() => {
    const result = checkWinner(board);
    if (result.winner) {
      setWinner(result.winner);
      setWinningLine(result.line);
      setGameState("won");
      const bonus = 100;
      setSessionScore((s) => s + bonus);
      setProfile((prev) => ({ ...prev, rewardsPoints: prev.rewardsPoints + bonus }));
      setShowVictoryModal(true);
    } else if (isBoardFull(board)) {
      setGameState("draw");
    }
  }, [board]);

  // Make a move
  const makeMove = useCallback(
    (index: number) => {
      if (board[index] || gameState !== "playing" || aiThinking) return;

      const newBoard = [...board];
      newBoard[index] = currentPlayer;
      setBoard(newBoard);

      if (gameMode === "passplay") {
        setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
      } else {
        setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
      }
    },
    [board, currentPlayer, gameState, gameMode, aiThinking]
  );

  // Reset board
  const resetBoard = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setGameState("playing");
    setWinner(null);
    setWinningLine(null);
    setShowVictoryModal(false);
  }, []);

  // Switch mode resets board
  const setMode = (mode: GameMode) => {
    setGameMode(mode);
    resetBoard();
  };

  // Theme actions
  const equipTheme = (themeId: string) => {
    setProfile((prev) => ({ ...prev, currentTheme: themeId }));
    showToast("Theme equipped!");
  };

  const unlockTheme = (themeId: string, cost: number) => {
    if (profile.rewardsPoints < cost) {
      showToast("Not enough points.");
      return;
    }
    setProfile((prev) => ({
      ...prev,
      rewardsPoints: prev.rewardsPoints - cost,
      unlockedThemes: [...prev.unlockedThemes, themeId],
    }));
    showToast("Theme unlocked!");
  };

  const redeemMemberId = () => {
    const trimmed = memberIdInput.trim();
    if (!trimmed) {
      setMemberIdError("Please enter a valid AAA Member ID.");
      return;
    }
    if (trimmed.length < 5) {
      setMemberIdError("ID too short. Use format AAA-XXXX-XX.");
      return;
    }
    setMemberIdError("");
    setProfile((prev) => ({ ...prev, rewardsPoints: prev.rewardsPoints + 500 }));
    setMemberIdInput("");
    showToast("+500 member bonus applied!");
  };

  // Build board container class
  const boardContainerClass = (() => {
    let cls = "grid grid-cols-3 gap-2 w-full max-w-xs mx-auto";
    if (profile.currentTheme === "neon-highway") cls += " theme-neon";
    return cls;
  })();

  // Build cell class
  const cellClass = (idx: number) => {
    let cls =
      "aspect-square bg-[#14171c] rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-150 select-none";
    if (winningLine && winningLine.includes(idx)) cls += " ring-2 ring-[#4f8cff]";
    return cls;
  };

  // Render a single cell
  const renderCell = (idx: number) => {
    const val = board[idx];
    const clickable = !val && gameState === "playing" && !aiThinking;
    return (
      <div
        key={idx}
        data-testid={`cell-${idx}-${val ? val.toLowerCase() : ""}`}
        className={cellClass(idx)}
        onClick={() => clickable && makeMove(idx)}
        role="button"
        tabIndex={clickable ? 0 : -1}
        aria-label={`Cell ${idx}${val ? `, ${val}` : ", empty"}`}
      >
        {val === "X" && <TowTruckIcon />}
        {val === "O" && <ServiceSedanIcon />}
      </div>
    );
  };

  // Determine turn label
  const turnLabel = (() => {
    if (gameState !== "playing") return null;
    if (currentPlayer === "X") return "Player 1 (Tow Truck)";
    return gameMode === "single" ? "AI (Service Sedan)" : "Player 2 (Service Sedan)";
  })();

  // Games played derived
  const gamesPlayed = Math.max(0, Math.floor(sessionScore / 100));

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e6e9ef] p-4 md:p-8">
      {/* Toast */}
      {toastMessage && (
        <div
          className="fixed top-4 right-4 z-[100] bg-[#14171c] border border-[#4f8cff]/40 rounded-lg px-4 py-2 text-sm shadow-lg"
          role="status"
        >
          {toastMessage}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AAA Roadside XO</h1>
            <p className="text-sm text-gray-500 mt-0.5">Tactical Tic-Tac-Toe Arena</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge tone="brand">Rewards</Badge>
              <span
                data-testid="rewards-points"
                className="font-mono text-[#4f8cff] tabular-nums"
              >
                {profile.rewardsPoints} pts
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowThemeModal(true)}
            >
              Themes
            </Button>
          </div>
        </header>

        {/* ── Main Grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Panel */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {/* Controls Row */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">Mode</Badge>
                  <select
                    value={gameMode}
                    onChange={(e) => setMode(e.target.value as GameMode)}
                    className="bg-[#14171c] border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-[#4f8cff]"
                  >
                    <option value="single">Single Player</option>
                    <option value="passplay">Pass &amp; Play</option>
                  </select>
                </div>

                {gameMode === "single" && (
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral">Difficulty</Badge>
                    <select
                      value={difficulty}
                      onChange={(e) => {
                        setDifficulty(e.target.value as Difficulty);
                        resetBoard();
                      }}
                      className="bg-[#14171c] border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-[#4f8cff]"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Turn Indicator */}
              <div
                data-testid="turn-indicator"
                className="mb-6 text-center min-h-[2rem] flex items-center justify-center"
              >
                {gameState === "playing" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Turn:</span>
                    {currentPlayer === "X" ? (
                      <>
                        <TowTruckIcon size={20} />
                        <span className="font-medium">Player 1 (Tow Truck)</span>
                      </>
                    ) : (
                      <>
                        <ServiceSedanIcon size={20} />
                        <span className="font-medium">{turnLabel}</span>
                      </>
                    )}
                    {aiThinking && (
                      <span className="ml-2 text-xs text-gray-500 animate-pulse">
                        AI thinking…
                      </span>
                    )}
                  </div>
                ) : gameState === "won" ? (
                  <span className="text-[#4f8cff] font-medium">
                    {winner === "X" ? "Player 1 Wins!" : "Player 2 Wins!"}
                  </span>
                ) : (
                  <span className="text-gray-500">Draw!</span>
                )}
              </div>

              {/* Game Board */}
              <div id="game-board" className={boardContainerClass}>
                {board.map((_, i) => renderCell(i))}
              </div>

              {/* Footer Row */}
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">Session</Badge>
                  <span
                    data-testid="session-score"
                    className="font-mono tabular-nums"
                  >
                    {sessionScore} pts
                  </span>
                </div>
                <Button variant="secondary" size="sm" onClick={resetBoard}>
                  Reset Board
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-3">Game Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Games Played</span>
                  <span className="font-mono tabular-nums">{gamesPlayed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Wins</span>
                  <span className="font-mono tabular-nums text-[#4f8cff]">
                    {gamesPlayed}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Losses</span>
                  <span className="font-mono tabular-nums text-red-400">
                    {Math.max(0, gamesPlayed - 1)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full" onClick={resetBoard}>
                  New Game
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setProfile({ ...DEFAULT_PROFILE });
                    setSessionScore(0);
                    showToast("Progress reset.");
                  }}
                >
                  Reset Progress
                </Button>
              </div>
            </Card>

            {/* How to Play */}
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-3">How to Play</h3>
              <ul className="space-y-1 text-sm text-gray-500">
                <li>• Select your game mode</li>
                <li>• Choose difficulty for AI opponent</li>
                <li>• Click cells to place your mark</li>
                <li>• Complete a line to win</li>
                <li>• Earn points for victories</li>
              </ul>
            </Card>

            {/* Empty State example (always visible for layout balance) */}
            {gamesPlayed === 0 && (
              <Card className="p-4">
                <EmptyState
                  title="No games yet"
                  message="Start playing to track your stats here."
                  description="Each win earns you 100 reward points toward exclusive themes."
                />
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* ── Victory Modal ─────────────────────────────────────────────── */}
      {showVictoryModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <Card className="w-full max-w-md p-6">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                {winner === "X" ? <TowTruckIcon size={48} /> : <ServiceSedanIcon size={48} />}
              </div>
              <h2 className="text-xl font-bold mb-2">
                {gameMode === "single" && winner === "X"
                  ? "AAA Roadside Victory!"
                  : winner === "X"
                  ? "Player 1 Wins!"
                  : "Player 2 Wins!"}
              </h2>
              <p className="text-gray-400 mb-4">
                {gameMode === "single" && winner === "X"
                  ? "Excellent work! You've earned 100 reward points."
                  : "Great game! 100 reward points awarded."}
              </p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Badge tone="brand">+100 pts</Badge>
                <span className="font-mono text-[#4f8cff] tabular-nums">
                  Total: {profile.rewardsPoints} pts
                </span>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="primary" onClick={resetBoard}>
                  Play Again
                </Button>
                <Button variant="outline" onClick={() => setShowVictoryModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Theme Modal ───────────────────────────────────────────────── */}
      {showThemeModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <Card className="w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">AAA Rewards Store</h2>
              <button
                onClick={() => setShowThemeModal(false)}
                className="text-gray-500 hover:text-[#e6e9ef] transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Member ID Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Badge tone="brand">Your Balance</Badge>
                <span
                  data-testid="rewards-points"
                  className="font-mono text-[#4f8cff] tabular-nums"
                >
                  {profile.rewardsPoints} pts
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter AAA Member ID"
                  value={memberIdInput}
                  onChange={(e) => {
                    setMemberIdInput(e.target.value);
                    setMemberIdError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && redeemMemberId()}
                  className="flex-1 bg-[#14171c] border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#4f8cff]"
                />
                <Button variant="outline" size="sm" onClick={redeemMemberId}>
                  Enter AAA Member ID
                </Button>
              </div>
              {memberIdError && (
                <p className="text-xs text-red-400 mt-1">{memberIdError}</p>
              )}
            </div>

            {/* Theme List */}
            <div className="space-y-3">
              {THEMES.map((theme) => {
                const unlocked = profile.unlockedThemes.includes(theme.id);
                const equipped = profile.currentTheme === theme.id;

                return (
                  <div
                    key={theme.id}
                    className="flex items-center justify-between p-3 bg-[#14171c] rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{theme.name}</h4>
                      <p className="text-sm text-gray-500">{theme.desc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {equipped ? (
                        <Badge tone="pass">Equipped</Badge>
                      ) : unlocked ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => equipTheme(theme.id)}
                        >
                          Equip Theme
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => unlockTheme(theme.id, theme.cost)}
                          disabled={profile.rewardsPoints < theme.cost}
                        >
                          Unlock ({theme.cost} pts)
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Empty State */}
            <div className="mt-6 pt-4 border-t border-gray-800">
              <EmptyState
                title="No More Themes"
                message="You've unlocked all available themes!"
                description="Keep playing to earn more points and unlock exclusive content."
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}