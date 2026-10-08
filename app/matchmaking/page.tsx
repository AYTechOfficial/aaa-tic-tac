"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, EmptyState, ListRow } from "@/components/ui";

type Record = { id: string; title: string; notes: string; createdAt: string };

const MOCK_OPPONENTS: Record[] = [
  { id: "usr_8a3f", title: "NeonStriker", notes: "Win rate 68%", createdAt: "2024-01-15T10:00:00Z" },
  { id: "usr_9b2c", title: "VoidWalker", notes: "Win rate 72%", createdAt: "2024-02-20T14:30:00Z" },
  { id: "usr_1d4e", title: "CipherAce", notes: "Win rate 65%", createdAt: "2024-03-10T09:15:00Z" },
];

export default function MatchmakingPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [discovered, setDiscovered] = useState<Record | null>(null);
  const [candidates, setCandidates] = useState<Record[]>(MOCK_OPPONENTS);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 20);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100 || isComplete) return;
    const timer = setTimeout(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, progress, isComplete]);

  useEffect(() => {
    if (progress >= 100 || isComplete) return;
    const discoverTimer = setTimeout(() => {
      if (!discovered && candidates.length > 0) {
        const idx = Math.floor(Math.random() * candidates.length);
        setDiscovered(candidates[idx]);
        setCandidates((prev) => prev.filter((_, i) => i !== idx));
      }
    }, 1500);
    return () => clearTimeout(discoverTimer);
  }, [discovered, candidates, progress, isComplete]);

  useEffect(() => {
    if (progress === 100 && !isComplete) {
      setIsComplete(true);
      try {
        const gameState = {
          board: Array(9).fill(null),
          currentPlayer: "player",
          winner: null,
          variant: "classic",
          startedAt: new Date().toISOString(),
        };
        localStorage.setItem("lastmile:aaa-tic-tac:GameState", JSON.stringify(gameState));
      } catch (err) {
        console.error("Failed to persist game state:", err);
      }
      router.push("/game");
    }
  }, [progress, isComplete, router]);

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e6e9ef] font-sans flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#14171c] border border-white/10 shadow-xl overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold tracking-tight text-[#e6e9ef]">Matchmaking Queue</h1>
            <Badge tone="brand">Searching</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-[#e6e9ef]/70">
              <span>PROGRESS</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4f8cff] transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-md p-3 text-center">
              <div className="text-xs font-mono text-[#e6e9ef]/60 mb-1">TIME LEFT</div>
              <div className="text-2xl font-mono font-bold text-[#4f8cff]">{countdown}s</div>
            </div>
            <div className="bg-white/5 rounded-md p-3 text-center">
              <div className="text-xs font-mono text-[#e6e9ef]/60 mb-1">STATUS</div>
              <div className="text-sm font-medium text-[#e6e9ef] truncate">
                {discovered ? "Opponent Found" : "Scanning Network..."}
              </div>
            </div>
          </div>

          {candidates.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {candidates.map((opponent) => (
                <ListRow
                  key={opponent.id}
                  title={opponent.title}
                  subtitle={`ID: ${opponent.id}`}
                  trailing={<span className="text-xs font-mono text-[#e6e9ef]/50">{opponent.notes}</span>}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Candidates"
              message="Network scan yielded no results."
              description="Try again later or adjust filters."
              icon="search"
            />
          )}

          {discovered && (
            <div className="p-3 bg-[#4f8cff]/10 border border-[#4f8cff]/30 rounded-md animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-[#e6e9ef]">{discovered.title}</div>
                  <div className="text-xs font-mono text-[#4f8cff]">{discovered.id}</div>
                </div>
                <Badge tone="pass">Ready</Badge>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}