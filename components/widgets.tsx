"use client";

import { useState, useEffect, useCallback } from "react";
import { readLocal, writeLocal } from "@/lib/persist";
import { Button } from "@/components/ui";
import { Card } from "@/components/ui";
import { Badge } from "@/components/ui";
import { EmptyState } from "@/components/ui";
import { ListRow } from "@/components/ui";

type Player = "X" | "O";
type CellValue = Player | null;
type Board = CellValue[];
type GamePhase = "lobby" | "queue" | "matched" | "playing" | "result" | "draw";

interface GameState {
  phase: GamePhase;
  board: Board;
  currentPlayer: Player;
  winner: Player | null;
  draw: boolean;
  queueTime: number;
  opponentRank: string;
  opponentAvatar: string;
  modifiers: { id: string; label: string; description: string }[];
  appliedModifiers: { cellIndex: number; modifierId: string }[];
  scoreX: number;
  scoreO: number;
}

const STORAGE_KEY = "lastmile:aaa-tic-tac:GameState";

const DEFAULT_STATE: GameState = {
  phase: "lobby",
  board: Array(9).fill(null),
  currentPlayer: "X",
  winner: null,
  draw: false,
  queueTime: 0,
  opponentRank: "Diamond III",
  opponentAvatar: "🤖",
  modifiers: [],
  appliedModifiers: [],
  scoreX: 0,
  scoreO: 0,
};

const WINNING_LINES: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const MODIFIER_OPTIONS = [
  { id: "swap", label: "Swap Positions", description: "Exchange your piece with an opponent's random piece" },
  { id: "freeze", label: "Freeze Cell", description: "Lock this cell — no further modifications allowed" },
  { id: "double", label: "Double Points", description: "This win counts as 2 points" },
  { id: "steal", label: "Cell Steal", description: "Take over one opponent's existing piece" },
];

function checkWinner(board: Board): Player | null {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

export default function AAA_TicTacToe() {
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const saved = readLocal<GameState>(STORAGE_KEY, DEFAULT_STATE);
      if (saved) return saved;
    } catch {}
    return DEFAULT_STATE;
  });

  useEffect(() => {
    try {
      writeLocal(STORAGE_KEY, gameState);
    } catch {}
  }, [gameState]);

  useEffect(() => {
    if (gameState.phase !== "queue") return;
    const interval = setInterval(() => {
      setGameState(prev => {
        const newTime = prev.queueTime + 1000;
        if (newTime >= 3000) {
          return { ...prev, phase: "matched", queueTime: 3000 };
        }
        return { ...prev, queueTime: newTime };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.phase]);

  useEffect(() => {
    if (gameState.phase !== "playing") return;
    const winner = checkWinner(gameState.board);
    if (winner) {
      setGameState(prev => ({
        ...prev,
        phase: "result",
        winner,
        scoreX: winner === "X" ? prev.scoreX + 1 : prev.scoreX,
        scoreO: winner === "O" ? prev.scoreO + 1 : prev.scoreO,
      }));
    } else if (gameState.board.every(cell => cell !== null)) {
      setTimeout(() => {
        setGameState(prev => ({ ...prev, phase: "draw", draw: true }));
      }, 1000);
    }
  }, [gameState.board, gameState.phase]);

  const handleFindMatch = () => {
    setGameState(prev => ({ ...prev, phase: "queue", queueTime: 0 }));
  };

  const handleCellClick = (index: number) => {
    if (gameState.phase !== "playing") return;
    if (gameState.board[index] !== null) return;

    const newBoard = [...gameState.board];
    newBoard[index] = gameState.currentPlayer;

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: prev.currentPlayer === "X" ? "O" : "X",
      modifiers: MODIFIER_OPTIONS.slice(0, 2),
    }));
  };

  const handleApplyModifier = (modifierId: string) => {
    setGameState(prev => ({
      ...prev,
      modifiers: [],
      appliedModifiers: [...prev.appliedModifiers, { cellIndex: 0, modifierId }],
    }));
  };

  const handlePlayAgain = () => {
    setGameState(prev => ({
      ...prev,
      phase: "lobby",
      board: Array(9).fill(null),
      currentPlayer: "X",
      winner: null,
      draw: false,
      queueTime: 0,
      modifiers: [],
      appliedModifiers: [],
    }));
  };

  switch (gameState.phase) {
    case "lobby":
      return (
        <div className="min-h-screen bg-[#0b0d10] text-[#e6e9ef] font-sans">
          <div className="max-w-lg mx-auto p-6">
            <h1 className="text-2xl font-bold mb-8 font-mono">AAA TIC TAC TOE</h1>
            <Card className="p-6 mb-6">
              <EmptyState
                title="No Active Match"
                message="Ready to find an opponent?"
                description="Click below to enter the matchmaking queue"
                icon="⚔️"
              />
            </Card>
            <Button
              id="find-match-btn"
              variant="primary"
              size="lg"
              onClick={handleFindMatch}
              className="w-full"
            >
              Find Match
            </Button>
            <div className="mt-6 flex justify-between text-sm font-mono text-gray-500">
              <span>Wins: X {gameState.scoreX}</span>
              <span>O {gameState.scoreO}</span>
            </div>
          </div>
        </div>
      );

    case "queue":
      return (
        <div className="min-h-screen bg-[#0b0d10] text-[#e6e9ef] font-sans">
          <div className="max-w-lg mx-auto p-6">
            <div className="text-center mb-8">
              <Badge tone="brand" className="mb-4">QUEUEING</Badge>
              <h2 className="text-xl font-mono mb-2">Finding Opponent...</h2>
              <p className="text-gray-400 font-mono">{Math.min(gameState.queueTime, 3000)}ms / 3000ms</p>
            </div>
            <div className="flex justify-center">
              <div className="animate-pulse w-16 h-16 rounded-full bg-[#4f8cff]/20 border border-[#4f8cff]/40"></div>
            </div>
          </div>
        </div>
      );

    case "matched":
      return (
        <div className="min-h-screen bg-[#0b0d10] text-[#e6e9ef] font-sans">
          <div className="max-w-lg mx-auto p-6">
            <div className="text-center mb-8">
              <Badge tone="pass" className="mb-4">MATCH FOUND</Badge>
              <h2 className="text-xl font-mono mb-4">Opponent Identified</h2>
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-4xl">{gameState.opponentAvatar}</div>
                <div>
                  <div className="font-mono text-[#4f8cff]">{gameState.opponentRank}</div>
                  <div className="text-sm text-gray-400">Ranked Player</div>
                </div>
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setGameState(prev => ({ ...prev, phase: "playing" }))}
              className="w-full"
            >
              Start Game
            </Button>
          </div>
        </div>
      );

    case "playing":
      return (
        <div className="min-h-screen bg-[#0b0d10] text-[#e6e9ef] font-sans">
          <div className="max-w-lg mx-auto p-6">
            <div className={`action-bar mb-6 ${gameState.currentPlayer === "X" ? "current-player-x" : "current-player-o"} font-mono text-center p-3 bg-[#14171c] rounded-lg border border-[#4f8cff]/20`}>
              <span className="text-[#4f8cff]">Current Player: {gameState.currentPlayer}</span>
            </div>

            <div className="flex justify-between mb-6 font-mono text-sm">
              <span>X: {gameState.scoreX}</span>
              <span>O: {gameState.scoreO}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {gameState.board.map((cell, index) => (
                <button
                  key={index}
                  data-empty={!cell}
                  data-filled={!!cell}
                  className={`cell aspect-square bg-[#14171c] border border-[#4f8cff]/20 rounded-lg flex items-center justify-center text-3xl font-mono hover:bg-[#14171c]/80 transition-colors ${cell === "X" ? "piece-x text-[#4f8cff]" : cell === "O" ? "piece-o text-red-400" : ""}`}
                  onClick={() => handleCellClick(index)}
                >
                  {cell || ""}
                </button>
              ))}
            </div>

            {gameState.modifiers.length > 0 && (
              <div className="modifier-panel bg-[#14171c] p-4 rounded-lg border border-[#4f8cff]/20 animate-slide-in">
                <h3 className="font-mono text-sm mb-3 text-[#4f8cff]">Select Modifier</h3>
                <div className="space-y-2">
                  {gameState.modifiers.map(mod => (
                    <button
                      key={mod.id}
                      className="apply-modifier w-full text-left p-3 bg-[#0b0d10] rounded border border-[#4f8cff]/10 hover:border-[#4f8cff]/40 transition-colors"
                      onClick={() => handleApplyModifier(mod.id)}
                    >
                      <div className="font-mono text-sm text-[#e6e9ef]">{mod.label}</div>
                      <div className="text-xs text-gray-400">{mod.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );

    case "result":
      return (
        <div className="min-h-screen bg-[#0b0d10] text-[#e6e9ef] font-sans">
          <div className="max-w-lg mx-auto p-6">
            <div className="result-screen opacity-1 transition-opacity duration-500 text-center">
              <Badge tone={gameState.winner === "X" ? "pass" : "warn"} className="mb-4">GAME OVER</Badge>
              <h2 className="winner-text text-3xl font-mono mb-2">
                {gameState.winner} Wins!
              </h2>
              <p className="text-gray-400 mb-6">Congratulations on the victory</p>
              <Button
                id="play-again-btn"
                variant="primary"
                size="lg"
                onClick={handlePlayAgain}
                className="w-full"
              >
                Play Again
              </Button>
            </div>
          </div>
        </div>
      );

    case "draw":
      return (
        <div className="min-h-screen bg-[#0b0d10] text-[#e6e9ef] font-sans">
          <div className="max-w-lg mx-auto p-6">
            <div className="draw-screen text-center">
              <Badge tone="neutral" className="mb-4">DRAW</Badge>
              <h2 className="text-2xl font-mono mb-2">Stalemate</h2>
              <p className="text-gray-400 mb-6">No winner this round</p>
              <Button
                variant="primary"
                size="lg"
                onClick={handlePlayAgain}
                className="w-full"
              >
                Play Again
              </Button>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}