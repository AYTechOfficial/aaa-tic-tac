"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button, Card, Badge, EmptyState, ListRow } from "@/components/ui";

type Record = { id: string; title: string; notes: string; createdAt: string };

const STORAGE_KEY = "lastmile:aaa-tic-tac:GameState";
const SKIN_KEY = "triad_equipped_skin";
const TIMER_DURATION = 30;

export default function GamePage() {
  const [boardSize, setBoardSize] = useState<number>(9);
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X");
  const [winner, setWinner] = useState<string | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [turnTimer, setTurnTimer] = useState(TIMER_DURATION);
  const [history, setHistory] = useState<Record[]>([]);
  const [variant, setVariant] = useState<"3x3" | "9x9">("3x3");
  const [skinClass, setSkinClass] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastPlacedRef = useRef<number>(-1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBoard(parsed.board || Array(9).fill(null));
        setBoardSize(parsed.boardSize || 9);
        setCurrentPlayer(parsed.currentPlayer || "X");
        setWinner(parsed.winner || null);
        setIsDraw(parsed.isDraw || false);
        setHistory(parsed.history || []);
        setVariant(parsed.variant || "3x3");
        setTurnTimer(parsed.turnTimer ?? TIMER_DURATION);
      } catch (e) {
        console.error("Failed to parse game state", e);
      }
    }
    const skin = localStorage.getItem(SKIN_KEY);
    if (skin) setSkinClass(skin);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const state = {
        board,
        boardSize,
        currentPlayer,
        winner,
        isDraw,
        history,
        variant,
        turnTimer,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [board, boardSize, currentPlayer, winner, isDraw, history, variant, turnTimer, isLoading]);

  useEffect(() => {
    if (winner || isDraw) return;
    timerRef.current = setInterval(() => {
      setTurnTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [winner, isDraw]);

  const resetTimer = useCallback(() => {
    setTurnTimer(TIMER_DURATION);
  }, []);

  const checkWinner = useCallback((currentBoard: (string | null)[], size: number): { winner: string | null; line: number[] } => {
    const lines: number[][] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c <= size - 3; c++) {
        lines.push([r * size + c, r * size + c + 1, r * size + c + 2]);
      }
    }
    for (let c = 0; c < size; c++) {
      for (let r = 0; r <= size - 3; r++) {
        lines.push([r * size + c, (r + 1) * size + c, (r + 2) * size + c]);
      }
    }
    for (let r = 0; r <= size - 3; r++) {
      for (let c = 0; c <= size - 3; c++) {
        lines.push([r * size + c, (r + 1) * size + c + 1, (r + 2) * size + c + 2]);
      }
    }
    for (let r = 0; r <= size - 3; r++) {
      for (let c = 2; c < size; c++) {
        lines.push([r * size + c, (r + 1) * size + c - 1, (r + 2) * size + c - 2]);
      }
    }

    for (const line of lines) {
      const [a, b, c] = line;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a], line };
      }
    }
    return { winner: null, line: [] };
  }, []);

  const handleCellClick = useCallback((index: number) => {
    if (winner || isDraw || board[index]) {
      if (board[index]) {
        if (lastPlacedRef.current >= 0 && cellRefs.current[lastPlacedRef.current]) {
          cellRefs.current[lastPlacedRef.current]?.focus();
        }
      }
      return;
    }

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    lastPlacedRef.current = index;
    resetTimer();

    const moveRecord: Record = {
      id: crypto.randomUUID(),
      title: `Move ${history.length + 1}`,
      notes: `${currentPlayer} placed at index ${index}`,
      createdAt: new Date().toISOString(),
    };
    setHistory((prev) => [moveRecord, ...prev]);

    const result = checkWinner(newBoard, boardSize);
    if (result.winner) {
      setWinner(result.winner);
    } else if (!newBoard.includes(null)) {
      setIsDraw(true);
    } else {
      setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
    }
  }, [board, currentPlayer, winner, isDraw, history, boardSize, checkWinner, resetTimer]);

  useEffect(() => {
    if (currentPlayer === "O" && !winner && !isDraw) {
      const timeout = setTimeout(() => {
        const emptyIndices = board.map((v, i) => v === null ? i : -1).filter(i => i !== -1);
        if (emptyIndices.length > 0) {
          const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          handleCellClick(randomIndex);
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentPlayer, board, winner, isDraw, handleCellClick]);

  const handleVariantChange = (newVariant: "3x3" | "9x9") => {
    setVariant(newVariant);
    const newSize = newVariant === "3x3" ? 9 : 81;
    setBoardSize(newSize);
    setBoard(Array(newSize).fill(null));
    setWinner(null);
    setIsDraw(false);
    setCurrentPlayer("X");
    setHistory([]);
    resetTimer();
  };

  const handleReset = () => {
    setBoard(Array(boardSize).fill(null));
    setWinner(null);
    setIsDraw(false);
    setCurrentPlayer("X");
    setHistory([]);
    resetTimer();
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#0b0d10] text-[#e6e9ef] font-mono">Initializing Arena...</div>;

  const cols = variant === "3x3" ? 3 : 9;
  const winningLine = winner ? checkWinner(board, boardSize).line : [];

  return (
    <div className={`min-h-screen bg-[#0b0d10] text-[#e6e9ef] p-4 md:p-8 font-sans ${skinClass}`}>
      <header className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e6e9ef]">Triad Arena</h1>
          <p className="text-sm text-gray-400 mt-1">Live Match • {variant}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={variant}
            onChange={(e) => handleVariantChange(e.target.value as "3x3" | "9x9")}
            className="bg-[#14171c] border border-gray-700 rounded px-3 py-2 text-sm font-mono text-[#e6e9ef] focus:outline-none focus:ring-2 focus:ring-[#4f8cff]"
          >
            <option value="3x3">Standard 3x3</option>
            <option value="9x9">Ultimate 9x9</option>
          </select>
          <Badge tone={winner ? "bad" : isDraw ? "warn" : "pass"}>
            {winner ? `${winner} Wins` : isDraw ? "Draw" : turnTimer > 0 ? `${turnTimer}s` : "Timeout"}
          </Badge>
          <Button variant="secondary" size="sm" onClick={handleReset}>Reset Board</Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-[#14171c] border-gray-800 p-4 flex flex-col items-center justify-center min-h-[400px]">
          <div className="mb-4 w-full flex justify-between items-center px-2">
            <span className="text-sm font-mono text-gray-400">BOARD STATUS</span>
            <div
              data-testid="turn-indicator"
              className={`text-sm font-bold px-3 py-1 rounded ${
                winner ? "bg-red-900/30 text-red-400" : isDraw ? "bg-yellow-900/30 text-yellow-400" : "bg-blue-900/30 text-blue-400"
              }`}
            >
              {winner ? "Match Ended" : isDraw ? "Stalemate" : currentPlayer === "X" ? "Your Turn" : "Opponent's Turn"}
            </div>
          </div>

          <div
            className={`grid gap-2 w-full max-w-md aspect-square ${
              variant === "3x3" ? "grid-cols-3" : "grid-cols-9"
            }`}
          >
            {board.map((cell, idx) => {
              const isWinning = winningLine.includes(idx);
              return (
                <button
                  key={idx}
                  ref={(el) => { cellRefs.current[idx] = el; }}
                  onClick={() => handleCellClick(idx)}
                  disabled={!!winner || !!isDraw || !!cell}
                  className={`
                    relative flex items-center justify-center text-2xl md:text-4xl font-mono rounded-lg border transition-all duration-200
                    ${cell ? "cell-occupied bg-[#0b0d10] border-gray-700" : "bg-[#14171c] border-gray-800 hover:border-[#4f8cff] cursor-pointer"}
                    ${isWinning ? "animate-pulse ring-4 ring-[#4f8cff]" : ""}
                    ${!cell && !winner && !isDraw ? "hover:bg-gray-800/50" : ""}
                  `}
                  aria-label={`Cell ${idx}`}
                >
                  {cell && <span className={`${cell === "X" ? "text-[#4f8cff]" : "text-[#e6e9ef]"}`}>{cell}</span>}
                </button>
              );
            })}
          </div>

          {(winner || isDraw) && (
            <div className="mt-6 flex gap-3">
              <Button variant="primary" size="md" onClick={handleReset}>Play Again</Button>
              <Button variant="ghost" size="md" onClick={() => window.location.href = "/"}>Return Home</Button>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="bg-[#14171c] border-gray-800 p-4 h-full">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Move History</h2>
            {history.length === 0 ? (
              <EmptyState
                title="No Moves Yet"
                message="The board is empty. Make your first move to begin tracking."
                description="Moves will appear here as they happen."
                className="py-8"
              />
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {history.map((record) => (
                  <ListRow
                    key={record.id}
                    record={{
                      id: record.id.slice(0, 8),
                      title: record.title,
                      notes: record.notes,
                      createdAt: new Date(record.createdAt).toLocaleTimeString(),
                    }}
                    trailing={<Badge tone="neutral">{record.id.slice(0, 8)}</Badge>}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card className="bg-[#14171c] border-gray-800 p-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Session Info</h2>
            <div className="space-y-2 text-sm font-mono text-gray-300">
              <div className="flex justify-between"><span>Variant:</span> <span className="text-[#e6e9ef]">{variant}</span></div>
              <div className="flex justify-between"><span>Grid Size:</span> <span className="text-[#e6e9ef]">{cols}x{cols}</span></div>
              <div className="flex justify-between"><span>Active Player:</span> <span className="text-[#4f8cff]">{currentPlayer}</span></div>
              <div className="flex justify-between"><span>Storage Key:</span> <span className="text-xs text-gray-500">lastmile:aaa-tic-tac:GameState</span></div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}