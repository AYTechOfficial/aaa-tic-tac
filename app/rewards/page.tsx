'use client';

import { useState } from 'react';
import { Button, Card, Badge } from '@/components/ui';
import { useStore } from '@/lib/store';

const REWARDS = [
  { id: 'neon-highway', name: 'Neon Highway Theme', cost: 200, type: 'theme' },
  { id: 'desert-route66', name: 'Desert Route 66 Theme', cost: 300, type: 'theme' },
  { id: 'badge-veteran', name: 'Veteran Driver Badge', cost: 100, type: 'badge' },
  { id: 'coupon-tow', name: 'Free Tow Coupon', cost: 150, type: 'coupon' },
];

export default function RewardsPage() {
  const { profile, unlockedThemes, redeemMemberId, unlockTheme, equipTheme } = useStore();
  const [memberInput, setMemberInput] = useState('');
  const [error, setError] = useState('');

  const handleRedeem = () => {
    if (!memberInput.trim()) {
      setError('Please enter a valid Member ID.');
      return;
    }
    redeemMemberId();
    setMemberInput('');
    setError('');
  };

  const handleUnlock = (rewardId: string, cost: number) => {
    if (profile.points_balance < cost) {
      setError('Insufficient points.');
      return;
    }
    unlockTheme(rewardId, cost);
    setError('');
  };

  const handleEquip = (themeId: string) => {
    equipTheme(themeId);
    window.dispatchEvent(new CustomEvent('theme-change', { detail: themeId }));
  };

  const isUnlocked = (id: string) => unlockedThemes.some(t => t.theme_id === id);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--primary)] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-bold text-[var(--accent)]">AAA Rewards Store</h1>
          <p className="text-[var(--secondary)]">Redeem your hard-earned points for exclusive themes, badges, and perks.</p>
          <Card className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full">
              <label htmlFor="member-id" className="block text-sm font-medium mb-2 text-[var(--secondary)]">Enter AAA Member ID</label>
              <input id="member-id" type="text" value={memberInput} onChange={(e) => setMemberInput(e.target.value)} placeholder="e.g., AAA-123456" className="w-full rounded-lg border border-white/10 bg-[var(--surface)] px-4 py-2 text-[var(--primary)] placeholder:text-[var(--secondary)]/50 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
            </div>
            <Button onClick={handleRedeem} variant="primary" size="lg">Redeem & Claim 500 Points</Button>
          </Card>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </header>
        <section>
          <h2 className="text-xl font-semibold mb-4 text-[var(--primary)]">Available Rewards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {REWARDS.map((reward) => {
              const unlocked = isUnlocked(reward.id);
              const isEquipped = profile.equipped_theme_id === reward.id;
              return (
                <Card key={reward.id} className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <Badge tone={reward.type === 'theme' ? 'brand' : reward.type === 'badge' ? 'pass' : 'warn'}>{reward.type.toUpperCase()}</Badge>
                    <span className="text-xs font-mono text-[var(--secondary)]">{reward.cost} pts</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-[var(--primary)]">{reward.name}</h3>
                    <p className="text-xs text-[var(--secondary)] mt-1">
                      {reward.type === 'theme' ? 'Applies a unique visual style to the game board.' : reward.type === 'badge' ? 'A permanent digital achievement displayed on your profile.' : 'Simulated roadside assistance voucher for future matches.'}
                    </p>
                  </div>
                  <div className="mt-auto pt-4 border-t border-white/5">
                    {!unlocked ? (
                      <Button onClick={() => handleUnlock(reward.id, reward.cost)} variant="secondary" disabled={profile.points_balance < reward.cost} className="w-full">Unlock ({reward.cost} pts)</Button>
                    ) : reward.type === 'theme' ? (
                      <Button onClick={() => handleEquip(reward.id)} variant={isEquipped ? 'primary' : 'outline'} className="w-full">{isEquipped ? 'Equipped' : 'Equip Theme'}</Button>
                    ) : (
                      <div className="w-full h-10 flex items-center justify-center text-xs text-emerald-400 font-medium">Unlocked ✓</div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
        <section className="pt-8 border-t border-white/10">
          <h2 className="text-xl font-semibold mb-4 text-[var(--primary)]">Your Collection</h2>
          {unlockedThemes.length === 0 ? (
            <div className="text-center py-8 text-[var(--secondary)]">No rewards unlocked yet. Play matches to earn points!</div>
          ) : (
            <div className="space-y-2">
              {unlockedThemes.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-sm text-[var(--primary)]">{REWARDS.find(r => r.id === t.theme_id)?.name || t.theme_id}</span>
                  <span className="text-xs text-[var(--secondary)]">Unlocked {new Date(t.unlocked_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}