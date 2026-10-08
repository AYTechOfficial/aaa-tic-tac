"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { readLocal, writeLocal } from "@/lib/persist";
import { Button, Card, Badge, EmptyState } from "@/components/ui";

// Shared record type as specified by harness contract
export type Record = { id: string; title: string; notes: string; createdAt: string };

const STORAGE_KEY = "lastmile:aaa-tic-tac:GameState";

type CellValue = "X" | "O" | null;
type Phase = "lobby" | "queue" | "playing" | "result";

interface GameState {
  phase: Phase;
  board: CellValue[];
  currentPlayer: "X" | "O";
  queueTime: number;
  opponent: { name: string; rank: string; avatar: string };
  modifiers: { id: string; label: string; targetIndex: number }[];
  targetCellIndex: number | null;
  winner: CellValue;
}

const INITIAL_STATE: GameState = {
  phase: "lobby",
  board: Array(9).fill(null),
  currentPlayer: "X",
  queueTime: 0,
  opponent: { name: "", rank: "", avatar: "" },
  modifiers: [],
  targetCellIndex: null,
  winner: null,
};

function generateOpponent() {
  const ranks = ["Bronze III", "Silver I", "Gold II", "Platinum IV"];
  const names = ["NeonStriker", "CyberViper", "QuantumAce", "VoidRunner"];
  return {
    name: names[Math.floor(Math.random() * names.length)],
    rank: ranks[Math.floor(Math.random() * ranks.length)],
    avatar: "👾",
  };
}

function getModifiers(currentPlayer: "X" | "O") {
  return [
    { id: "double-strike", label: "Double Strike", targetIndex: Math.floor(Math.random() * 9) },
    { id: "cell-lock", label: "Cell Lock", targetIndex: Math.floor(Math.random() * 9) },
  ];
}

function checkWinner(board: CellValue[]): CellValue {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

export default function Page() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const queueRef = useRef<number | null>(null);
  const drawTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modifierFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persistence: Safe hydration on mount
  useEffect(() => {
    try {
      const saved = readLocal<GameState>(STORAGE_KEY, INITIAL_STATE);
      if (saved) setState(saved);
    } catch (err) {
      console.error("Persistence read failed", err);
    }
  }, []);

  // Persistence: Save on meaningful state changes
  useEffect(() => {
    try {
      writeLocal(STORAGE_KEY, state);
    } catch (err) {
      console.error("Persistence write failed", err);
    }
  }, [state]);

  // Queue Timer Logic
  useEffect(() => {
    if (state.phase === "queue") {
      queueRef.current = window.setInterval(() => {
        setState((prev) => {
          const nextTime = prev.queueTime + 1000;
          if (nextTime >= 3000) {
            if (queueRef.current) clearInterval(queueRef.current);
            return {
              ...prev,
              phase: "playing",
              queueTime: 3000,
              opponent: generateOpponent(),
            };
          }
          return { ...prev, queueTime: nextTime };
        });
      }, 1000);
    } else {
      if (queueRef.current) clearInterval(queueRef.current);
    }
    return () => {
      if (queueRef.current) clearInterval(queueRef.current);
    };
  }, [state.phase]);

  // Draw Resolution Delay
  useEffect(() => {
    if (state.phase === "playing" && !state.winner && state.board.every(Boolean)) {
      drawTimerRef.current = setTimeout(() => {
        setState((prev) => ({ ...prev, phase: "result", winner: null }));
      }, 1000);
    } else {
      if (drawTimerRef.current) clearTimeout(drawTimerRef.current);
    }
    return () => {
      if (drawTimerRef.current) clearTimeout(drawTimerRef.current);
    };
  }, [state.phase, state.winner, state.board]);

  const handleFindMatch = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: "queue",
      queueTime: 0,
      opponent: { name: "", rank: "", avatar: "" },
    }));
  }, []);

  const handleCellClick = useCallback((index: number) => {
    if (state.phase !== "playing" || state.board[index] || state.modifiers.length > 0) return;

    setState((prev) => {
      const newBoard = [...prev.board];
      newBoard[index] = prev.currentPlayer;
      const winner = checkWinner(newBoard);
      const nextPlayer = prev.currentPlayer === "X" ? "O" : "X";
      const modifiers = getModifiers(nextPlayer);

      return {
        ...prev,
        board: newBoard,
        currentPlayer: nextPlayer,
        winner,
        modifiers,
        phase: winner ? "result" : prev.phase,
      };
    });
  }, [state.phase, state.board, state.modifiers.length]);

  const handleApplyModifier = useCallback((modId: string) => {
    setState((prev) => {
      const mod = prev.modifiers.find((m) => m.id === modId);
      if (!mod) return prev;

      const newBoard = [...prev.board];
      newBoard[mod.targetIndex] = prev.currentPlayer;
      const winner = checkWinner(newBoard);

      // Trigger flash effect
      if (modifierFlashRef.current) clearTimeout(modifierFlashRef.current);
      modifierFlashRef.current = setTimeout(() => {
        setState((s) => ({ ...s, targetCellIndex: null }));
      }, 500);

      return {
        ...prev,
        board: newBoard,
        modifiers: [],
        targetCellIndex: mod.targetIndex,
        winner,
        phase: winner ? "result" : prev.phase,
      };
    });
  }, []);

  const handlePlayAgain = useCallback(() => {
    setState(INITIAL_STATE);
    // Re-trigger matchmaking queue immediately
    setTimeout(() => {
      setState((prev) => ({ ...prev, phase: "queue", queueTime: 0 }));
    }, 150);
  }, []);

  const isLobby = state.phase === "lobby";
  const isQueue = state.phase === "queue";
  const isPlaying = state.phase === "playing";
  const isResult = state.phase === "result";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0b0d10] text-[#e6e9ef] font-sans selection:bg-[#4f8cff] selection:text-white">
      <div className="w-full max-w-md mx-auto p-4 flex flex-col gap-4">
        {/* Header */}
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold tracking-tight font-mono text-[#4f8cff]">AAA TIC TAC TOE</h1>
          <Badge tone={isResult ? "bad" : "brand"}>{isResult ? "MATCH OVER" : "RANKED LOBBY"}</Badge>
        </header>

        {/* Lobby Container */}
        <section id="lobby-container" className={`lobby-container ${isLobby ? "block" : "hidden"} transition-opacity duration-300`}>
          <Card className="bg-[#14171c] border border-white/5 p-6 flex flex-col gap-4">
            <EmptyState
              title="No Active Matches"
              message="Enter the queue to find an opponent."
              description="Simulated ranked matchmaking. Estimated wait: ~3s."
              icon="⚔️"
            />
            <Button
              id="find-match-btn"
              variant="primary"
              size="lg"
              onClick={handleFindMatch}
              className="w-full font-mono tracking-wide"
            >
              FIND MATCH
            </Button>
          </Card>
        </section>

        {/* Queue View */}
        {isQueue && (
          <section className="lobby-container hidden">
            <Card className="bg-[#14171c] border border-white/5 p-6 flex flex-col items-center gap-4">
              <div className="text-sm font-mono text-[#4f8cff]">SEARCHING OPPONENT...</div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4f8cff] transition-all duration-1000 ease-linear"
                  style={{ width: `${Math.min((state.queueTime / 3000) * 100, 100)}%` }}
                />
              </div>
              <div className="font-mono text-xs text-white/50">{state.queueTime}ms</div>
            </Card>
          </section>
        )}

        {/* Match Modal Overlay */}
        {(isQueue && state.queueTime >= 3000) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <Card className="bg-[#14171c] border border-[#4f8cff]/30 p-6 max-w-xs w-full text-center shadow-2xl shadow-[#4f8cff]/10">
              <div className="mb-4">
                <div className="opponent-avatar text-4xl mb-2">{state.opponent.avatar}</div>
                <div className="opponent-rank-badge inline-block px-2 py-1 bg-[#4f8cff]/20 text-[#4f8cff] text-xs font-mono rounded mb-2">
                  {state.opponent.rank}
                </div>
                <h3 className="text-lg font-bold font-mono">{state.opponent.name}</h3>
              </div>
              <Button variant="outline" size="sm" onClick={() => setState((prev) => ({ ...prev, phase: "playing" }))}>
                START GAME
              </Button>
            </Card>
          </div>
        )}

        {/* Game Board */}
        <section id="game-board" className={`game-board ${isPlaying || isResult ? "block" : "hidden"} transition-opacity duration-500`}>
          <div className="flex items-center justify-between mb-4 px-1">
            <div className={`current-player-${state.currentPlayer.toLowerCase()} font-mono text-sm text-[#4f8cff]`}>
              TURN: {state.currentPlayer}
            </div>
            <div className="text-xs font-mono text-white/40">ROUND 1</div>
          </div>

          <div className="grid grid-cols-3 gap-2 aspect-square max-w-[320px] mx-auto">
            {state.board.map((cell, idx) => {
              const isTarget = state.targetCellIndex === idx;
              return (
                <button
                  key={idx}
                  className={`cell relative flex items-center justify-center bg-[#14171c] border border-white/10 rounded hover:border-[#4f8cff]/50 transition-colors ${
                    cell ? "cursor-default" : "cursor-pointer"
                  } ${isTarget ? "modified-state" : ""}`}
                  data-index={idx}
                  data-empty={!cell}
                  data-filled={!!cell}
                  data-target={isTarget ? "true" : undefined}
                  onClick={() => handleCellClick(idx)}
                >
                  {cell && (
                    <span className={`text-3xl font-mono font-bold ${cell === "X" ? "piece-x text-[#4f8cff]" : "piece-o text-[#e6e9ef]"}`}>
                      {cell}
                    </span>
                  )}
                  {isTarget && (
                    <span className="absolute inset-0 bg-[#4f8cff]/30 animate-pulse pointer-events-none rounded"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Modifier Panel */}
          {state.modifiers.length > 0 && isPlaying && (
            <div className="modifier-panel mt-4 bg-[#14171c] border border-white/10 rounded-lg p-3 transition-transform duration-300 translate-y-0">
              <div className="text-xs font-mono text-white/50 mb-2 uppercase tracking-wider">Select Modifier</div>
              <div className="flex gap-2">
                {state.modifiers.map((mod) => (
                  <button
                    key={mod.id}
                    className="apply-modifier flex-1 bg-white/5 hover:bg-[#4f8cff]/20 border border-white/10 hover:border-[#4f8cff]/50 rounded px-3 py-2 text-xs font-mono text-left transition-colors"
                    onClick={() => handleApplyModifier(mod.id)}
                  >
                    <div className="font-bold text-[#e6e9ef]">{mod.label}</div>
                    <div className="text-white/40 text-[10px]">Target: Cell {mod.targetIndex + 1}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Result Screen */}
        {isResult && (
          <section className="result-screen fixed inset-0 z-40 flex items-center justify-center bg-black/90 backdrop-blur-md transition-opacity duration-500 opacity-100">
            <Card className="bg-[#14171c] border border-[#4f8cff]/30 p-8 max-w-sm w-full text-center shadow-2xl">
              {state.winner ? (
                <>
                  <div className="text-5xl mb-4">{state.winner === "X" ? "❌" : "⭕"}</div>
                  <div className="winner-text text-2xl font-bold font-mono text-[#4f8cff] mb-2">
                    PLAYER {state.winner} WINS
                  </div>
                  <p className="text-white/60 text-sm mb-6">Victory achieved in round 1.</p>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-4">🤝</div>
                  <div className="draw-screen text-xl font-bold font-mono text-white/80 mb-2">DRAW</div>
                  <p className="text-white/60 text-sm mb-6">Board full. No winner detected.</p>
                </>
              )}
              <Button
                id="play-again-btn"
                variant="primary"
                size="lg"
                onClick={handlePlayAgain}
                className="w-full font-mono"
              >
                PLAY AGAIN
              </Button>
            </Card>
          </section>
        )}

        {/* Footer / Status */}
        <footer className="mt-auto pt-4 text-center">
          <div className="text-[10px] font-mono text-white/30">CLIENT-SIDE SIMULATION • NO SERVER SYNC</div>
        </footer>
      </div>
    </div>
  );
}