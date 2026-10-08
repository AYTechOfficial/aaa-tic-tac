"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button, Card, Badge, EmptyState, ListRow } from "@/components/ui";

type Record = { id: string; title: string; notes: string; createdAt: string };

type CellValue = "X" | "O" | null;
type ViewMode = "landing" | "matchmaking" | "game" | "skins";

export default function TriadArenaLanding() {
  const [view, setView] = useState<ViewMode>("landing");
  const [variant, setVariant] = useState<"3x3" | "9x9">("3x3");
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"player" | "opponent">("player");
  const [winner, setWinner] = useState<string | null>(null);
  const [winningCells, setWinningCells] = useState<number[]>([]);
  const [equippedSkin, setEquippedSkin] = useState<string>("default");
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: "" });
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastPlacedIndex, setLastPlacedIndex] = useState<number | null>(null);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const gridSize = variant === "3x3" ? 9 : 81;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lastmile:aaa-tic-tac:GameState");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.board?.length === gridSize) {
          setBoard(parsed.board);
          setTurn(parsed.turn || "player");
          setWinner(parsed.winner || null);
          setWinningCells(parsed.winningCells || []);
          setView("game");
        }
      }
      const skin = localStorage.getItem("triad_equipped_skin");
      if (skin) setEquippedSkin(skin);
    } catch {
      setError("Critical: Failed to parse local storage state.");
    }
  }, [gridSize]);

  useEffect(() => {
    if (view === "game") {
      try {
        localStorage.setItem(
          "lastmile:aaa-tic-tac:GameState",
          JSON.stringify({ board, turn, winner, winningCells, variant })
        );
      } catch {
        setError("Storage quota exceeded or unavailable.");
      }
    }
  }, [board, turn, winner, winningCells, variant, view]);

  const startMatchmaking = () => {
    window.history.pushState({}, "", "/matchmaking");
    setView("matchmaking");
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            window.history.pushState({}, "", "/game");
            setView("game");
            setBoard(Array(gridSize).fill(null));
            setTurn("player");
            setWinner(null);
            setWinningCells([]);
            setLastPlacedIndex(null);
          }, 100);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const checkWin = useCallback(
    (currentBoard: CellValue[]) => {
      const size = variant === "3x3" ? 3 : 9;
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
          lines.push([r * size + c + 2, (r + 1) * size + c + 1, (r + 2) * size + c]);
        }
      }

      for (const line of lines) {
        const [a, b, c] = line;
        if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
          return line;
        }
      }
      return null;
    },
    [variant]
  );

  const handleCellClick = (index: number) => {
    if (winner || turn !== "player" || board[index]) {
      if (board[index]) {
        cellRefs.current[index]?.focus();
      }
      return;
    }

    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);
    setLastPlacedIndex(index);
    setTurn("opponent");

    const winLine = checkWin(newBoard);
    if (winLine) {
      setWinner("player");
      setWinningCells(winLine);
      return;
    }

    setTimeout(() => {
      setBoard((prev) => {
        const oppBoard = [...prev];
        const emptyIndices = oppBoard.map((v, i) => (v === null ? i : -1)).filter((i) => i !== -1);
        if (emptyIndices.length === 0) return oppBoard;

        const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        oppBoard[randomIdx] = "O";

        const oppWin = checkWin(oppBoard);
        if (oppWin) {
          setWinner("opponent");
          setWinningCells(oppWin);
        } else {
          setTurn("player");
        }
        return oppBoard;
      });
    }, 500);
  };

  const equipSkin = (skinId: string) => {
    try {
      localStorage.setItem("triad_equipped_skin", skinId);
      setEquippedSkin(skinId);
      setToast({ visible: true, message: "Skin equipped" });
      setTimeout(() => setToast({ visible: false, message: "" }), 2000);
    } catch {
      setError("Failed to save skin preference.");
    }
  };

  const renderGrid = () => {
    const cols = variant === "3x3" ? "grid-cols-3" : "grid-cols-9";
    return (
      <div className={`grid ${cols} gap-1 w-full max-w-md mx-auto`}>
        {board.map((cell, i) => (
          <button
            key={i}
            ref={(el) => { cellRefs.current[i] = el; }}
            onClick={() => handleCellClick(i)}
            disabled={!!winner || turn !== "player"}
            className={`aspect-square flex items-center justify-center text-lg font-mono border border-[#1f2329] transition-all duration-200 ${
              cell ? "cell-occupied bg-[#1a1e24]" : "hover:bg-[#1a1e24] cursor-pointer"
            } ${winningCells.includes(i) ? "animate-pulse ring-2 ring-[#4f8cff]" : ""}`}
            aria-label={`Cell ${i}, ${cell || "empty"}`}
          >
            {cell || <span className="text-[#1f2329] text-xs">·</span>}
          </button>
        ))}
      </div>
    );
  };

  if (view === "matchmaking") {
    return (
      <div className="min-h-screen bg-[#0b0d10] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <h2 className="text-[#e6e9ef] font-sans text-xl tracking-tight">Initializing Match...</h2>
          <div className="h-2 bg-[#14171c] rounded overflow-hidden">
            <div
              className="h-full bg-[#4f8cff] transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[#4f8cff] font-mono text-sm">{progress}% connected</p>
        </div>
      </div>
    );
  }

  if (view === "skins") {
    return (
      <div className="min-h-screen bg-[#0b0d10] p-6 md:p-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="flex items-center justify-between border-b border-[#1f2329] pb-4">
            <h1 className="text-[#e6e9ef] font-sans text-2xl font-bold">Skin Shop</h1>
            <Button variant="ghost" size="sm" onClick={() => { window.history.back(); setView("landing"); }}>Back</Button>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["neon-circuit", "void-walker", "chrome-core"].map((id) => (
              <Card key={id} className="relative group overflow-hidden border border-[#1f2329] bg-[#14171c]">
                <div className="aspect-video bg-[#0b0d10] flex items-center justify-center relative">
                  <div className={`absolute inset-0 opacity-20 ${id === "neon-circuit" ? "bg-[#4f8cff]" : id === "void-walker" ? "bg-[#a855f7]" : "bg-[#22c55e]"}`} />
                  <span className="font-mono text-[#e6e9ef] text-sm z-10 uppercase tracking-widest">{id}</span>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[#e6e9ef] font-sans font-medium">{id.replace("-", " ")}</span>
                    <Badge tone={equippedSkin === id ? "pass" : "neutral"}>{equippedSkin === id ? "EQUIPPED" : "UNOWNED"}</Badge>
                  </div>
                  <p className="text-[#4f8cff]/70 text-xs font-mono">ID: {id.toUpperCase()}</p>
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => equipSkin(id)}
                    className="scale-105 group-hover:scale-105 transition-transform"
                  >
                    Equip
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          {toast.visible && (
            <div className="fixed bottom-6 right-6 bg-[#14171c] border border-[#4f8cff] text-[#e6e9ef] px-4 py-2 rounded shadow-lg font-mono text-sm">
              {toast.message}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === "game") {
    return (
      <div className={`min-h-screen bg-[#0b0d10] p-4 md:p-8 flex flex-col items-center justify-center transition-colors duration-300 ${equippedSkin === "neon-circuit" ? "ring-4 ring-[#4f8cff]/30" : equippedSkin === "void-walker" ? "ring-4 ring-[#a855f7]/30" : equippedSkin === "chrome-core" ? "ring-4 ring-[#22c55e]/30" : ""}`}>
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#1f2329] pb-4">
            <div className="space-y-1">
              <h1 className="text-[#e6e9ef] font-sans text-xl font-bold tracking-tight">Triad Arena</h1>
              <p className="text-[#4f8cff] font-mono text-xs">SESSION: {Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setView("skins")}>Shop</Button>
              <Button variant="ghost" size="sm" onClick={() => { window.history.back(); setView("landing"); }}>Exit</Button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[#e6e9ef] font-sans text-sm">Variant:</span>
              <select
                value={variant}
                onChange={(e) => {
                  setVariant(e.target.value as "3x3" | "9x9");
                  setBoard(Array(e.target.value === "3x3" ? 9 : 81).fill(null));
                  setTurn("player");
                  setWinner(null);
                  setWinningCells([]);
                }}
                className="bg-[#14171c] border border-[#1f2329] text-[#e6e9ef] font-mono text-sm px-2 py-1 rounded outline-none focus:border-[#4f8cff]"
              >
                <option value="3x3">Standard 3x3</option>
                <option value="9x9">Ultimate 9x9</option>
              </select>
            </div>
            <div
              data-testid="turn-indicator"
              className={`px-3 py-1 rounded font-mono text-sm ${turn === "player" ? "bg-[#4f8cff]/20 text-[#4f8cff]" : "bg-[#1f2329] text-[#e6e9ef]"}`}
            >
              {winner ? `WINNER: ${winner.toUpperCase()}` : turn === "player" ? "YOUR TURN" : "OPPONENT'S TURN"}
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-900/50 text-red-400 px-3 py-2 rounded text-sm font-mono">
              {error}
            </div>
          )}

          <div className="flex justify-center">
            {renderGrid()}
          </div>

          {(winner || board.every(Boolean)) && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="primary" size="md" onClick={() => {
                setBoard(Array(gridSize).fill(null));
                setTurn("player");
                setWinner(null);
                setWinningCells([]);
              }}>Rematch</Button>
              <Button variant="secondary" size="md" onClick={() => { window.history.back(); setView("landing"); }}>Return Home</Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d10] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-[#e6e9ef] font-sans text-4xl font-bold tracking-tighter">TRIAD ARENA</h1>
          <p className="text-[#4f8cff] font-mono text-sm tracking-wide">TACTICAL TIC-TAC-TOE SIMULATION</p>
        </div>

        <Card className="border border-[#1f2329] bg-[#14171c] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[#e6e9ef] font-sans font-medium">Quick Match</span>
            <Badge tone="brand">LIVE</Badge>
          </div>
          <p className="text-[#4f8cff]/80 text-sm leading-relaxed">
            Enter the arena. Opponents are simulated with randomized decision trees to prevent solved draws.
          </p>
          <Button variant="primary" size="lg" className="w-full" onClick={startMatchmaking}>
            Start Match
          </Button>
        </Card>

        <Card className="border border-[#1f2329] bg-[#14171c] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[#e6e9ef] font-sans font-medium">Configuration</span>
            <Badge tone="neutral">V1.0.4</Badge>
          </div>
          <div className="space-y-2">
            <label className="text-[#4f8cff] font-mono text-xs uppercase">Grid Variant</label>
            <select
              value={variant}
              onChange={(e) => setVariant(e.target.value as "3x3" | "9x9")}
              className="w-full bg-[#0b0d10] border border-[#1f2329] text-[#e6e9ef] font-mono text-sm px-3 py-2 rounded outline-none focus:border-[#4f8cff]"
            >
              <option value="3x3">Standard 3x3</option>
              <option value="9x9">Ultimate 9x9</option>
            </select>
          </div>
          <div className="pt-2 border-t border-[#1f2329]">
            <Button variant="outline" size="md" className="w-full" onClick={() => setView("skins")}>
              Open Skin Shop
            </Button>
          </div>
        </Card>

        <div className="text-center">
          <EmptyState
            title="No Active Sessions"
            description="Initialize a match to begin recording your session logs."
            className="py-4"
          />
        </div>
      </div>
    </div>
  );
}