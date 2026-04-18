"use client";

import { create } from "zustand";

interface XPAnimation {
  id: string;
  amount: number;
  x: number;
  y: number;
}

interface XPState {
  animations: XPAnimation[];
  triggerAnimation: (amount: number, x?: number, y?: number) => void;
  removeAnimation: (id: string) => void;
}

let animationCounter = 0;

export const useXPStore = create<XPState>((set, get) => ({
  animations: [],

  triggerAnimation: (amount, x = 0, y = 0) => {
    const id = `xp-${++animationCounter}`;
    const animation: XPAnimation = { id, amount, x, y };

    set({ animations: [...get().animations, animation] });

    // Auto-remove after animation completes
    setTimeout(() => {
      set({
        animations: get().animations.filter((a) => a.id !== id),
      });
    }, 1000);
  },

  removeAnimation: (id) =>
    set({
      animations: get().animations.filter((a) => a.id !== id),
    }),
}));
