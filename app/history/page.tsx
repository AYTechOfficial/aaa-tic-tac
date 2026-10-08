"use client";

import { useEffect, useState } from "react";
import { readLocal } from "@/lib/persist";
import { Button, Card, Badge, EmptyState, ListRow } from "@/components/ui";

type RecordItem = { id: string; title: string; notes: string; createdAt: string };

const STORAGE_KEY = "lastmile:aaa-tic-tac:gameState";

export default function HistoryPage() {
  const [matches, setMatches] = useState<RecordItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = readLocal(STORAGE_KEY, null);
      let data: RecordItem[] = [];
      if (Array.isArray(raw)) {
        data = raw;
      } else if (raw && typeof raw === "object" && Array.isArray((raw as Record<string, unknown>).matches)) {
        data = (raw as Record<string, unknown>).matches as RecordItem[];
      }
      setMatches(data);
    } catch (e) {
      setError("Failed to load local history. Storage may be unavailable.");
    }
  }, []);

  return (
    <div
      className="min-h-screen bg-[#0b0d10] text-[#e6e9ef] p-6 font-sans selection:bg-[#4f8cff] selection:text-white"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center justify-between border-b border-[#14171c] pb-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[#e6e9ef]">Match History</h1>
            <p className="text-xs text-gray-500 mt-0.5">Local read-only log of past results</p>
          </div>
          <Badge tone="neutral">{matches.length} entries</Badge>
        </header>

        {error && (
          <div className="p-3 bg-red-900/20 border border-red-800/50 rounded text-sm text-red-300">
            {error}
          </div>
        )}

        <Card className="bg-[#14171c] border border-[#0b0d10] rounded-lg overflow-hidden shadow-sm">
          {matches.length === 0 ? (
            <EmptyState
              title="No matches recorded"
              message="Complete a game to populate your local history log."
              description="Results persist across sessions via client storage."
              className="py-12"
            />
          ) : (
            <div className="divide-y divide-[#0b0d10]">
              {matches.map((match) => (
                <ListRow
                  key={match.id}
                  record={match}
                  title={<span className="truncate" title={match.title}>{match.title}</span>}
                  subtitle={
                    <span
                      className="font-mono text-xs text-[#4f8cff] truncate"
                      style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    >
                      {new Date(match.createdAt).toISOString().slice(0, 19)}
                    </span>
                  }
                  trailing={
                    <Badge
                      tone={
                        match.notes.toLowerCase().includes("win")
                          ? "pass"
                          : match.notes.toLowerCase().includes("draw")
                          ? "warn"
                          : "neutral"
                      }
                    >
                      {match.notes.split(" ")[0].toUpperCase()}
                    </Badge>
                  }
                  className="px-4 py-3 hover:bg-[#0b0d10]/60 transition-colors cursor-default"
                />
              ))}
            </div>
          )}
        </Card>

        <div className="flex justify-end pt-2">
          <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
            Refresh Log
          </Button>
        </div>
      </div>
    </div>
  );
}