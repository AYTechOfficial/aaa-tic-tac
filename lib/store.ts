import { useState, useEffect, useCallback } from 'react';

export interface Profile {
  id: string;
  member_id: string;
  points_balance: number;
  tier: string;
  equipped_theme_id: string | null;
  created_at: string;
}

export interface UnlockedTheme {
  id: string;
  theme_id: string;
  unlocked_at: string;
  cost_points: number;
}

export interface MatchHistory {
  id: string;
  mode: string;
  winner: string;
  played_at: string;
}

const STORAGE_KEYS = {
  profile: 'aaa_xo_profile',
  unlocked_themes: 'aaa_xo_unlocked_themes',
  match_history: 'aaa_xo_match_history',
};

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export function useStore() {
  const [profile, setProfile] = useState<Profile>(() => getFromStorage(STORAGE_KEYS.profile, {
    id: crypto.randomUUID(),
    member_id: '',
    points_balance: 0,
    tier: 'Bronze',
    equipped_theme_id: null,
    created_at: new Date().toISOString(),
  }));

  const [unlockedThemes, setUnlockedThemes] = useState<UnlockedTheme[]>(() => getFromStorage(STORAGE_KEYS.unlocked_themes, []));
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>(() => getFromStorage(STORAGE_KEYS.match_history, []));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.unlocked_themes, JSON.stringify(unlockedThemes));
  }, [unlockedThemes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.match_history, JSON.stringify(matchHistory));
  }, [matchHistory]);

  const addPoints = useCallback((amount: number) => {
    setProfile(prev => ({
      ...prev,
      points_balance: prev.points_balance + amount,
    }));
  }, []);

  const redeemMemberId = useCallback(() => {
    setProfile(prev => ({
      ...prev,
      member_id: prev.member_id || `MEM-${Math.floor(Math.random() * 10000)}`,
      points_balance: prev.points_balance + 500,
    }));
  }, []);

  const unlockTheme = useCallback((themeId: string, cost: number) => {
    if (profile.points_balance < cost) return false;
    
    setProfile(prev => ({
      ...prev,
      points_balance: prev.points_balance - cost,
    }));

    setUnlockedThemes(prev => {
      if (prev.some(t => t.theme_id === themeId)) return prev;
      return [...prev, {
        id: crypto.randomUUID(),
        theme_id: themeId,
        unlocked_at: new Date().toISOString(),
        cost_points: cost,
      }];
    });

    return true;
  }, [profile.points_balance]);

  const equipTheme = useCallback((themeId: string) => {
    setProfile(prev => ({
      ...prev,
      equipped_theme_id: themeId,
    }));
  }, []);

  return {
    profile,
    unlockedThemes,
    matchHistory,
    addPoints,
    redeemMemberId,
    unlockTheme,
    equipTheme,
    setMatchHistory,
  };
}