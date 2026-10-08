"use client";

import React, { useState, useEffect } from "react";
import { readLocal, writeLocal } from "@/lib/persist";
import { Button, Card, Badge } from "@/components/ui";

type BoardCell = string | null;
type Board = BoardCell[][];
type GamePhase = "idle" | "matchmaking" | "playing" | "won" | "drawn";
type Skin = "classic" | "neon" | "steel";

interface GameState {
  phase: GamePhase;
  board: Board;
  currentPlayer: "X" | "O";
  winner: string | null;
  winningLine: [number, number][] | null;
  skin: Skin;
  movesCount: number;
}

const INITIAL_BOARD: Board = Array(3)
  .fill(null)
  .map(() => Array(3).fill(null));
const STORAGE_KEY = "lastmile:aaa-tic-tac:gameState";

const checkWinner = (
  board: Board
): { winner: string; line: [number, number][] } | null => {
  const lines: [number, number][][] = [
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]],
  ];

  for (const line of lines) {
    const [a, b, c] = line;
    if (
      board[a[0]][a[1]] &&
      board[a[0]][a[1]] === board[b[0]][b[1]] &&
      board[a[0]][a[1]] === board[c[0]][c[1]]
    ) {
      return { winner: board[a[0]][a[1]]!, line };
    }
  }
  return null;
};

export default function PlayPage() {
  const [state, setState] = useState<GameState>(() => {
    try {
      const saved = readLocal<GameState>(STORAGE_KEY, null);
      return (
        saved || {
          phase: "idle",
          board: INITIAL_BOARD,
          currentPlayer: "X",
          winner: null,
          winningLine: null,
          skin: "classic",
          movesCount: 0,
        }
      );
    } catch {
      return {
        phase: "idle",
        board: INITIAL_BOARD,
        currentPlayer: "X",
        winner: null,
        winningLine: null,
        skin: "classic",
        movesCount: 0,
      };
    }
  });

  const [matchProgress, setMatchProgress] = useState(0);
  const [shakeCell, setShakeCell] = useState<[number, number] | null>(null);

  useEffect(() => {
    writeLocal(STORAGE_KEY, state);
  }, [state]);

  const startMatchmaking = () => {
    setState((prev) => ({ ...prev, phase: "matchmaking" }));
    setMatchProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setMatchProgress(progress);
      if (progress >= 100) clearInterval(interval);
    }, 40);

    setTimeout(() => {
      clearInterval(interval);
      setMatchProgress(100);
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          phase: "playing",
          board: INITIAL_BOARD,
          currentPlayer: "X",
          winner: null,
          winningLine: null,
          movesCount: 0,
        }));
        setMatchProgress(0);
      }, 300);
    }, 2000);
  };

  const handleCellClick = (r: number, c: number) => {
    if (state.phase !== "playing") return;
    if (state.board[r][c]) {
      setShakeCell([r, c]);
      setTimeout(() => setShakeCell(null), 500);
      return;
    }

    const newBoard = state.board.map((row) => [...row]);
    newBoard[r][c] = state.currentPlayer;
    const newMoves = state.movesCount + 1;
    const winResult = checkWinner(newBoard);

    if (winResult) {
      setState((prev) => ({
        ...prev,
        board: newBoard,
        winner: winResult.winner,
        winningLine: winResult.line,
        phase: "won",
        movesCount: newMoves,
      }));
    } else if (newMoves === 9) {
      setState((prev) => ({
        ...prev,
        board: newBoard,
        phase: "drawn",
        movesCount: newMoves,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        board: newBoard,
        currentPlayer: prev.currentPlayer === "X" ? "O" : "X",
        movesCount: newMoves,
      }));
    }
  };

  const resetGame = () => {
    setState((prev) => ({
      ...prev,
      phase: "playing",
      board: INITIAL_BOARD,
      currentPlayer: "X",
      winner: null,
      winningLine: null,
      movesCount: 0,
    }));
  };

  const changeSkin = (skin: Skin) => {
    setState((prev) => ({ ...prev, skin }));
  };

  const getBoardSkin = () => {
    switch (state.skin) {
      case "neon":
        return "border-[#4f8cff] bg-[#0b0d10]/80 shadow-[0_0_10px_#4f8cff]";
      case "steel":
        return "border-gray-600 bg-gray-800/50 shadow-inner";
      default:
        return "border-[#e6e9ef]/30 bg-[#14171c]";
    }
  };

  const getCellSkin = () => {
    switch (state.skin) {
      case "neon":
        return "hover:bg-[#4f8cff]/10 hover:border-[#4f8cff]";
      case "steel":
        return "hover:bg-gray-700/50 hover:border-gray-500";
      default:
        return "hover:bg-[#e6e9ef]/5 hover:border-[#e6e9ef]/50";
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e6e9ef] font-sans selection:bg-[#4f8cff]/30">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        .animate-progress { transition: width 2s linear; }
      `}</style>

      <header className="flex items-center justify-between px-6 py-4 border-b border-[#e6e9ef]/10 bg-[#14171c]">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-[#4f8cff]">TRIPLE_A_TIC_TAC_TOE</span>
          <Badge
            tone={
              state.phase === "playing"
                ? "pass"
                : state.phase === "won"
                ? "warn"
                : "neutral"
            }
          />
        </div>
        <nav className="flex gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = "/settings")}
          >
            Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = "/")}
          >
            Back
          </Button>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto p-6 flex flex-col items-center gap-8">
        {state.phase === "idle" && (
          <Card className="w-full max-w-md p-8 flex flex-col items-center gap-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Ready to Play?</h1>
            <p className="text-sm text-[#e6e9ef]/60">
              Initialize matchmaking sequence to begin a session against CPU_α.
            </p>
            <Button variant="primary" size="lg" onClick={startMatchmaking}>
              Find Match
            </Button>
          </Card>
        )}

        {state.phase === "matchmaking" && (
          <Card className="w-full max-w-md p-8 flex flex-col items-center gap-6">
            <div className="w-full h-2 bg-[#e6e9ef]/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4f8cff] animate-progress"
                style={{ width: `${matchProgress}%` }}
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-mono text-[#4f8cff]">
                ESTABLISHING CONNECTION...
              </span>
              <span className="text-xs text-[#e6e9ef]/50">
                {Math.round(matchProgress)}%
              </span>
            </div>
          </Card>
        )}

        {(state.phase === "playing" || state.phase === "won" || state.phase === "drawn") && (
          <>
            <div className="w-full flex items-center justify-between px-4 py-3 bg-[#14171c] rounded-lg border border-[#e6e9ef]/10">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#e6e9ef]/60">
                  OPPONENT:
                </span>
                <span className="text-sm font-semibold text-[#e6e9ef]">
                  CPU_α
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#e6e9ef]/60">
                  TURN:
                </span>
                <span
                  className={`text-sm font-bold font-mono ${
                    state.currentPlayer === "X" ? "text-[#4f8cff]" : "text-[#e6e9ef]"
                  }`}
                >
                  {state.currentPlayer}
                </span>
              </div>
            </div>

            <div
              className={`grid grid-cols-3 gap-2 p-4 rounded-xl border-2 ${getBoardSkin()} transition-colors duration-300`}
            >
              {state.board.map((row, r) =>
                row.map((cell, c) => {
                  const isWinning = state.winningLine?.some(
                    ([wr, wc]) => wr === r && wc === c
                  );
                  const isShaking =
                    shakeCell?.[0] === r && shakeCell?.[1] === c;
                  return (
                    <button
                      key={`${r}-${c}`}
                      disabled={state.phase !== "playing" || !!cell}
                      onClick={() => handleCellClick(r, c)}
                      className={`aspect-square flex items-center justify-center text-3xl font-mono font-bold rounded-lg border transition-all duration-150 ${getCellSkin()} ${
                        isWinning
                          ? "shadow-[0_0_15px_rgba(255,215,0,0.6)] border-yellow-400 bg-yellow-400/10"
                          : ""
                      } ${isShaking ? "animate-shake" : ""}`}
                    >
                      {cell || ""}
                    </button>
                  );
                })
              )}
            </div>

            {state.phase === "playing" && (
              <div className="text-xs font-mono text-[#e6e9ef]/40">
                MOVE #{state.movesCount + 1} / 9
              </div>
            )}
          </>
        )}

        {state.phase === "won" && (
          <Card className="w-full max-w-md p-6 flex flex-col items-center gap-4 border-yellow-400/30 bg-yellow-400/5">
            <h2 className="text-xl font-bold text-yellow-400">
              VICTORY DETECTED
            </h2>
            <p className="text-sm text-[#e6e9ef]/70">
              Player {state.winner} secured three consecutive positions.
            </p>
            <Button variant="primary" onClick={resetGame}>
              Play Again
            </Button>
          </Card>
        )}

        {state.phase === "drawn" && (
          <Card className="w-full max-w-md p-6 flex flex-col items-center gap-4 border-[#e6e9ef]/20">
            <h2 className="text-xl font-bold text-[#e6e9ef]">
              DRAW CONDITION
            </h2>
            <p className="text-sm text-[#e6e9ef]/70">
              Grid fully occupied. No winning alignment found.
            </p>
            <Button variant="secondary" onClick={resetGame}>
              Play Again
            </Button>
          </Card>
        )}
      </main>

      <div className="fixed bottom-6 right-6 z-50">
        <details className="group">
          <summary className="cursor-pointer bg-[#14171c] border border-[#e6e9ef]/20 rounded-lg px-4 py-2 text-sm font-mono hover:bg-[#e6e9ef]/5 transition-colors">
            SETTINGS
          </summary>
          <div className="absolute bottom-full mb-2 right-0 w-64 bg-[#14171c] border border-[#e6e9ef]/20 rounded-lg p-4 shadow-xl">
            <label className="block text-xs font-mono text-[#e6e9ef]/60 mb-2">
              BOARD_SKIN
            </label>
            <select
              value={state.skin}
              onChange={(e) => changeSkin(e.target.value as Skin)}
              className="w-full bg-[#0b0d10] border border-[#e6e9ef]/20 rounded px-3 py-2 text-sm text-[#e6e9ef] focus:outline-none focus:border-[#4f8cff]"
            >
              <option value="classic">Classic Matte</option>
              <option value="neon">Neon Glow</option>
              <option value="steel">Industrial Steel</option>
            </select>
          </div>
        </details>
      </div>
    </div>
  );
}