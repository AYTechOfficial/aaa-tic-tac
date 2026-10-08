"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Card, Badge, EmptyState } from "@/components/ui";

type Record = { id: string; title: string; notes: string; createdAt: string };

const SKINS: Record[] = [
  { id: "skin-neon-grid", title: "Neon Grid", notes: "High-contrast cyan lines on dark substrate. Optimized for low-latency rendering.", createdAt: "2024-01-15T08:00:00Z" },
  { id: "skin-circuit-board", title: "Circuit Board", notes: "Traces and nodes mimicking PCB layout. Provides subtle visual feedback on cell interaction.", createdAt: "2024-02-20T10:30:00Z" },
  { id: "skin-vaporwave", title: "Vaporwave", notes: "Pastel palette with retro-futuristic geometry. Increases perceived depth without GPU overhead.", createdAt: "2024-03-10T14:15:00Z" }
];

export default function SkinsPage() {
  const [equippedId, setEquippedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("triad_equipped_skin");
      if (saved) setEquippedId(saved);
    } catch (err) {
      console.error("Failed to read equipped skin:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  }, []);

  const handleEquip = useCallback((skinId: string) => {
    try {
      localStorage.setItem("triad_equipped_skin", skinId);
      setEquippedId(skinId);
      showToast("Skin equipped", "success");
    } catch (err) {
      console.error("Failed to save skin:", err);
      showToast("Failed to equip skin. Storage may be full.", "error");
    }
  }, [showToast]);

  if (isLoading) return <div className="min-h-screen bg-[#0b0d10] flex items-center justify-center text-[#4f8cff]">Loading...</div>;

  if (SKINS.length === 0) {
    return (
      <div className="min-h-screen bg-[#0b0d10] p-8">
        <EmptyState title="No Cosmetics Available" message="The customization hub is currently empty." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e6e9ef] p-6 md:p-12 font-sans">
      <header className="mb-10 border-b border-[#14171c] pb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Cosmetic Hub</h1>
        <p className="text-[#a0a5b0] max-w-2xl">
          Select board and piece aesthetics. Changes persist across sessions and apply immediately to the game view.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SKINS.map((skin) => {
          const isEquipped = equippedId === skin.id;
          return (
            <div
              key={skin.id}
              className="group relative overflow-hidden rounded-lg border border-[#14171c] bg-[#14171c] transition-transform duration-200 hover:scale-[1.05]"
            >
              <Card className="h-full flex flex-col p-0">
                <div className="h-40 w-full bg-[#0b0d10] flex items-center justify-center border-b border-[#14171c]">
                  <div className={`w-24 h-24 rounded-md ${isEquipped ? "ring-2 ring-[#4f8cff]" : ""}`} style={{ backgroundColor: skin.id.includes("neon") ? "#4f8cff" : skin.id.includes("circuit") ? "#2a2d35" : "#d946ef" }}></div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[#e6e9ef]">{skin.title}</h3>
                      <span className="text-xs font-mono text-[#4f8cff]">{skin.id}</span>
                    </div>
                    {isEquipped && <Badge tone="pass" />}
                  </div>

                  <p className="text-sm text-[#a0a5b0] mb-4 flex-1 leading-relaxed">
                    {skin.notes.length > 200 ? skin.notes.slice(0, 200) + "\u2026" : skin.notes}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#14171c]">
                    <span className="text-xs font-mono text-[#6b7280]">{new Date(skin.createdAt).toLocaleDateString()}</span>
                    <Button
                      variant={isEquipped ? "secondary" : "primary"}
                      size="sm"
                      onClick={() => !isEquipped && handleEquip(skin.id)}
                      disabled={isEquipped}
                      className={`${isEquipped ? "opacity-50 cursor-default" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                    >
                      {isEquipped ? "Active" : "Equip"}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-md shadow-lg border flex items-center gap-3 z-50 transition-opacity duration-300 ${
            toast.type === "success" ? "bg-[#14171c] border-[#4f8cff] text-[#4f8cff]" : "bg-[#14171c] border-red-500 text-red-400"
          }`}
        >
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}