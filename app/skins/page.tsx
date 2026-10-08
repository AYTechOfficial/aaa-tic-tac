"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";

const SKINS = [
  { id: "neon-highway", name: "Neon Highway", preview_url: "https://placehold.co/300x200/1e293b/38bdf8?text=Neon+Highway", category: "theme" },
  { id: "desert-route66", name: "Desert Route 66", preview_url: "https://placehold.co/300x200/1e293b/f43f5e?text=Desert+Route+66", category: "theme" },
  { id: "void-cipher", name: "Void Cipher", preview_url: "https://placehold.co/300x200/1e293b/a78bfa?text=Void+Cipher", category: "theme" },
];

export default function SkinsPage() {
  const router = useRouter();
  const [equippedSkin, setEquippedSkin] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const skin = localStorage.getItem("triad_equipped_skin");
    if (skin) setEquippedSkin(skin);
  }, []);

  const handleEquip = (skinId: string) => {
    localStorage.setItem("triad_equipped_skin", skinId);
    setEquippedSkin(skinId);
    setToast("Skin equipped");
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e6e9ef] p-6 md:p-12 font-sans">
      <header className="max-w-4xl mx-auto mb-8 flex justify-between items-center border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold text-[#e6e9ef]">Skin Shop</h1>
        <Button variant="outline" onClick={() => router.push("/")}>Back to Arena</Button>
      </header>

      {toast && (
        <div className="fixed top-4 right-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2 rounded-lg shadow-xl z-50 animate-fade-in">
          {toast}
        </div>
      )}

      <main className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {SKINS.map((skin) => (
          <div
            key={skin.id}
            className={`relative group rounded-xl border border-white/10 bg-[#14171c] overflow-hidden transition-transform duration-200 ${
              equippedSkin === skin.id ? "ring-2 ring-[#4f8cff]" : ""
            } hover:scale-[1.05]`}
          >
            <img src={skin.preview_url} alt={skin.name} className="w-full h-40 object-cover" />
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-bold text-[#e6e9ef]">{skin.name}</h3>
                <p className="text-xs text-gray-400 uppercase">{skin.category}</p>
              </div>
              <Button
                variant={equippedSkin === skin.id ? "secondary" : "primary"}
                size="sm"
                className={`w-full transition-opacity duration-200 ${
                  equippedSkin === skin.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
                onClick={() => handleEquip(skin.id)}
              >
                {equippedSkin === skin.id ? "Equipped" : "Equip"}
              </Button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}