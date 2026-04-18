"use client";

import { create } from "zustand";
import type { ReviewCard, ReviewResult } from "@/types";

interface CardResult {
  cardId: string;
  rating: number;
  xpEarned: number;
  responseTimeMs: number;
}

interface SessionState {
  sessionId: string | null;
  cards: ReviewCard[];
  currentIndex: number;
  results: CardResult[];
  xpEarned: number;
  isFlipped: boolean;
  isComplete: boolean;
  startTime: number | null;

  startSession: (sessionId: string, cards: ReviewCard[]) => void;
  flipCard: () => void;
  submitCard: (cardId: string, rating: number, xp: number) => void;
  nextCard: () => void;
  completeSession: () => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessionId: null,
  cards: [],
  currentIndex: 0,
  results: [],
  xpEarned: 0,
  isFlipped: false,
  isComplete: false,
  startTime: null,

  startSession: (sessionId, cards) =>
    set({
      sessionId,
      cards,
      currentIndex: 0,
      results: [],
      xpEarned: 0,
      isFlipped: false,
      isComplete: false,
      startTime: Date.now(),
    }),

  flipCard: () => set({ isFlipped: true }),

  submitCard: (cardId, rating, xp) => {
    const state = get();
    const result: CardResult = {
      cardId,
      rating,
      xpEarned: xp,
      responseTimeMs: state.startTime ? Date.now() - state.startTime : 0,
    };

    set({
      results: [...state.results, result],
      xpEarned: state.xpEarned + xp,
    });
  },

  nextCard: () => {
    const state = get();
    const nextIndex = state.currentIndex + 1;

    if (nextIndex >= state.cards.length) {
      set({ isComplete: true, isFlipped: false });
    } else {
      set({
        currentIndex: nextIndex,
        isFlipped: false,
        startTime: Date.now(),
      });
    }
  },

  completeSession: () => set({ isComplete: true }),

  reset: () =>
    set({
      sessionId: null,
      cards: [],
      currentIndex: 0,
      results: [],
      xpEarned: 0,
      isFlipped: false,
      isComplete: false,
      startTime: null,
    }),
}));
