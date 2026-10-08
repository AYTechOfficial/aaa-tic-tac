'use client';

import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { useStore } from '@/lib/store';

const REWARDS = [
  { id: 'neon-highway', name: 'Neon Highway Theme', cost: 500, type: 'theme' },
  { id: 'desert-route66', name: 'Desert Route 66 Theme', cost: 500, type: 'theme' },
  { id: 'badge-veteran', name: 'Veteran Driver Badge', cost: 200, type: 'badge' },
  { id: 'coupon-tow', name: 'Free Tow Coupon', cost: 300, type: 'coupon' },
];

export default function RewardsPage() {
  const { profile, addPoints, unlockedThemes, unlockTheme, equipTheme } = useStore();
  const [memberId, setMemberId] = useState('');
  const [error, setError] = useState('');

  const handleRedeem = () => {
    if (!memberId.trim()) {
      setError('Please enter a valid Member ID.');
      return;
    }
    if (memberId.length < 3) {
      setError('Member ID must be at least 3 characters.');
      return;
    }
    addPoints(500);
    setMemberId('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--primary)] p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold text-[var(--accent)]">Rewards Store</h1>
        <Button variant="outline" onClick={() => window.location.href = '/'}>Back to Arena</Button>
      </header>
      <main className="w-full max-w-4xl space-y-8">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Redeem Member ID</h2>
          <div className="flex gap-4">
            <input
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              placeholder="Enter AAA Member ID"
              className="flex-1 rounded-lg border border-white/10 bg-[var(--surface)] px-4 py-2 text-[var(--primary)] focus:border-[var(--accent)] focus:outline-none"
            />
            <Button onClick={handleRedeem}>Redeem</Button>
          </div>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REWARDS.map((reward) => {
            const isUnlocked = unlockedThemes?.some((t: any) => t.theme_id === reward.id);
            const isEquipped = profile.equipped_theme_id === reward.id;
            
            return (
              <Card key={reward.id} className="p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg">{reward.name}</h3>
                  <p className="text-sm text-[var(--secondary)] mt-1">Cost: {reward.cost} points</p>
                </div>
                <div className="mt-4">
                  {isEquipped ? (
                    <Button disabled variant="secondary">Equipped</Button>
                  ) : isUnlocked ? (
                    <Button onClick={() => equipTheme(reward.id)}>Equip Theme</Button>
                  ) : (
                    <Button 
                      onClick={() => unlockTheme(reward.id, reward.cost)} 
                      disabled={profile.points_balance < reward.cost}
                      variant={profile.points_balance >= reward.cost ? 'primary' : 'secondary'}
                    >
                      Unlock ({reward.cost})
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}