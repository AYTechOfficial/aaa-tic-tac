"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Card, Badge, EmptyState, ListRow } from "@/components/ui";

type Record = { id: string; title: string; notes: string; createdAt: string };

interface Profile {
  memberId?: string;
  points: number;
  unlockedThemes: string[];
  equippedTheme?: string;
  records: Record[];
}

const STORAGE_KEY = "lastmile:aaa-tic-tac:profiles";

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProfile();
    const parsed = JSON.parse(raw);
    return {
      memberId: parsed.memberId || undefined,
      points: typeof parsed.points === "number" ? parsed.points : 0,
      unlockedThemes: Array.isArray(parsed.unlockedThemes) ? parsed.unlockedThemes : [],
      equippedTheme: typeof parsed.equippedTheme === "string" ? parsed.equippedTheme : undefined,
      records: Array.isArray(parsed.records) ? parsed.records : [],
    };
  } catch {
    return defaultProfile();
  }
}

function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage full or unavailable — leave UI usable
  }
}

function defaultProfile(): Profile {
  return {
    memberId: undefined,
    points: 0,
    unlockedThemes: [],
    equippedTheme: undefined,
    records: [],
  };
}

interface ThemeItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  cssClass: string;
}

const THEMES: ThemeItem[] = [
  {
    id: "neon-highway",
    name: "Neon Highway Theme",
    description: "Glowing cyan and magenta accents on dark asphalt backgrounds.",
    cost: 300,
    cssClass: "theme-neon",
  },
  {
    id: "classic-road",
    name: "Classic Road Theme",
    description: "Warm amber tones reminiscent of vintage roadside signage.",
    cost: 200,
    cssClass: "theme-classic",
  },
  {
    id: "midnight-patrol",
    name: "Midnight Patrol Theme",
    description: "Deep navy overlays with subtle radar-sweep animations.",
    cost: 500,
    cssClass: "theme-midnight",
  },
];

export default function RewardsPage() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [memberIdInput, setMemberIdInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  const handleRedeemMemberId = () => {
    setError(null);
    setSuccess(null);
    const trimmed = memberIdInput.trim();
    if (!trimmed) {
      setError("Please enter a valid AAA Member ID.");
      return;
    }
    if (profile.memberId) {
      setError("A member ID has already been redeemed.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const newProfile = { ...profile, memberId: trimmed, points: profile.points + 500 };
      setProfile(newProfile);
      saveProfile(newProfile);
      setSuccess(`Member ID ${trimmed} accepted. +500 bonus points applied.`);
      setMemberIdInput("");
      setLoading(false);
    }, 400);
  };

  const handleUnlockTheme = (theme: ThemeItem) => {
    setError(null);
    setSuccess(null);
    if (profile.unlockedThemes.includes(theme.id)) {
      return;
    }
    if (profile.points < theme.cost) {
      setError(`Insufficient points. You need ${theme.cost} points but have ${profile.points}.`);
      return;
    }
    const newProfile = {
      ...profile,
      points: profile.points - theme.cost,
      unlockedThemes: [...profile.unlockedThemes, theme.id],
    };
    setProfile(newProfile);
    saveProfile(newProfile);
    setSuccess(`${theme.name} unlocked! Equip it to change the game board appearance.`);
  };

  const handleEquipTheme = (theme: ThemeItem) => {
    setError(null);
    setSuccess(null);
    if (!profile.unlockedThemes.includes(theme.id)) {
      setError("You must unlock this theme first.");
      return;
    }
    const newProfile = { ...profile, equippedTheme: theme.id };
    setProfile(newProfile);
    saveProfile(newProfile);
    setSuccess(`${theme.name} equipped. Return to the game to see the change.`);
  };

  const handleClearData = () => {
    if (!confirm("Are you sure you want to clear all saved progress? This cannot be undone.")) return;
    localStorage.removeItem(STORAGE_KEY);
    setProfile(defaultProfile());
    setSuccess("All progress cleared.");
  };

  const getThemeStatus = (theme: ThemeItem) => {
    const unlocked = profile.unlockedThemes.includes(theme.id);
    const equipped = profile.equippedTheme === theme.id;
    if (equipped) return "equipped";
    if (unlocked) return "unlocked";
    return "locked";
  };

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e6e9ef]">
      <header className="border-b border-[#1a1e24] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-mono text-[#4f8cff] hover:text-[#7aa4ff] transition-colors">
            ← Game Board
          </Link>
          <h1 className="text-lg font-semibold tracking-wide">AAA Member Rewards</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-mono text-[#8b90a0]">Points:</span>
          <span
            data-testid="rewards-points"
            className="font-mono text-xl font-bold text-[#4f8cff]"
          >
            {profile.points}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Member ID Section */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 font-mono text-[#8b90a0]">
            Redeem Member ID
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={memberIdInput}
              onChange={(e) => setMemberIdInput(e.target.value)}
              placeholder="Enter AAA Member ID"
              className="flex-1 rounded-md border border-[#2a2f38] px-3 py-2 text-sm font-mono outline-none focus:border-[#4f8cff] transition-colors bg-[#0b0d10] text-[#e6e9ef]"
              onKeyDown={(e) => e.key === "Enter" && handleRedeemMemberId()}
              disabled={!!profile.memberId || loading}
            />
            <Button
              variant="primary"
              size="md"
              onClick={handleRedeemMemberId}
              disabled={!!profile.memberId || loading}
            >
              {loading ? "Processing..." : profile.memberId ? "Already Redeemed" : "Enter AAA Member ID"}
            </Button>
          </div>
          {profile.memberId && (
            <div className="mt-3 flex items-center gap-2">
              <Badge tone="pass">Verified</Badge>
              <span className="text-xs font-mono text-[#8b90a0]">{profile.memberId}</span>
            </div>
          )}
        </Card>

        {/* Error / Success Messages */}
        {error && (
          <div className="rounded-md p-3 text-sm bg-[#1a1215] border border-[#2a1a1e]">
            <span className="text-red-400">{error}</span>
          </div>
        )}
        {success && (
          <div className="rounded-md p-3 text-sm bg-[#121a14] border border-[#1a2a1e]">
            <span className="text-green-400">{success}</span>
          </div>
        )}

        {/* Themes Section */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 font-mono text-[#8b90a0]">
            Available Themes
          </h2>
          {THEMES.length === 0 ? (
            <EmptyState
              title="No themes available"
              message="Check back later for new AAA member exclusives."
              className="py-8"
            />
          ) : (
            <div className="space-y-3">
              {THEMES.map((theme) => {
                const status = getThemeStatus(theme);
                return (
                  <ListRow
                    key={theme.id}
                    title={theme.name}
                    subtitle={theme.description}
                    trailing={
                      <div className="flex items-center gap-2">
                        {status === "locked" && (
                          <>
                            <span className="text-xs font-mono mr-2 text-[#8b90a0]">{theme.cost} pts</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnlockTheme(theme)}
                              disabled={profile.points < theme.cost}
                            >
                              Unlock
                            </Button>
                          </>
                        )}
                        {status === "unlocked" && (
                          <>
                            <Badge tone="neutral">Unlocked</Badge>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleEquipTheme(theme)}
                            >
                              Equip Theme
                            </Button>
                          </>
                        )}
                        {status === "equipped" && (
                          <Badge tone="brand">Equipped</Badge>
                        )}
                      </div>
                    }
                    className="rounded-md"
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Records / Badges Section */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 font-mono text-[#8b90a0]">
            Achievement Log
          </h2>
          {profile.records.length === 0 ? (
            <EmptyState
              title="No achievements yet"
              description="Win games to earn badges and track your progress."
              className="py-8"
            />
          ) : (
            <div className="space-y-2">
              {profile.records.map((record) => (
                <ListRow
                  key={record.id}
                  title={record.title}
                  subtitle={record.notes}
                  trailing={<span className="text-xs font-mono text-[#8b90a0]">{record.createdAt}</span>}
                  className="rounded-md"
                />
              ))}
            </div>
          )}
        </section>

        {/* Danger Zone */}
        <section className="pt-4 border-t border-[#1a1e24]">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 font-mono text-[#8b90a0]">
            Data Management
          </h2>
          <Button variant="danger" size="sm" onClick={handleClearData}>
            Clear All Saved Progress
          </Button>
        </section>
      </main>
    </div>
  );
}