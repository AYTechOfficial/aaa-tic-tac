"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Badge, EmptyState } from "@/components/ui";

export default function TriadArenaLanding() {
  const router = useRouter();
  const [variant, setVariant] = useState<"3x3" | "9x9">("3x3");

  const startMatchmaking = () => {
    router.push("/matchmaking");
  };

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
            <Link href="/skins">
              <Button variant="outline" size="md" className="w-full">
                Open Skin Shop
              </Button>
            </Link>
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