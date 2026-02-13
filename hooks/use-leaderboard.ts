"use client";

import { useState, useCallback } from "react";

// ── TYPES ──

export interface LeaderboardRow {
  rank: number;
  wallet: string;
  best_score: number;
  best_tier: string;
  games_played: number;
  fc_fid?: string;
  fc_username?: string;
  fc_display_name?: string;
  fc_pfp?: string;
}

export interface PlayerProfile {
  stats: {
    games_played: number;
    best_score: number;
    best_tier: string;
    best_survived: boolean;
    last_played: number;
    wallet: string;
    fc_fid?: string;
    fc_username?: string;
    fc_display_name?: string;
    fc_pfp?: string;
  };
  games: Array<{
    score: number;
    tier: string;
    survived: boolean;
    days: number;
    miles: number;
    survivors: number;
    class: string;
    timestamp: number;
  }>;
  rank: number | null;
}

// ── LEADERBOARD HOOK ──

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch {
      setError("Could not load leaderboard");
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { leaderboard, loading, error, fetchLeaderboard };
}

// ── PLAYER PROFILE HOOK ──

export function usePlayerProfile() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (address: string) => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leaderboard/${address.toLowerCase()}`);
      if (res.status === 404) {
        setProfile(null);
        setError("Player not found");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProfile(data);
    } catch {
      setError("Could not load profile");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearProfile = useCallback(() => {
    setProfile(null);
    setError(null);
  }, []);

  return { profile, loading, error, fetchProfile, clearProfile };
}

// ── SCORE SUBMISSION (fire-and-forget) ──

export async function submitScore(params: {
  wallet: string;
  score: number;
  classId: string;
  survivors: number;
  days: number;
  miles: number;
  survived: boolean;
}): Promise<void> {
  try {
    await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    // Fire-and-forget: silently ignore submission errors
  }
}
