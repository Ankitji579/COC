
import { create } from 'zustand';

interface GameState {
    gold: number;
    energy: number;
    researchPoints: number;
    baseHp: number;
    maxBaseHp: number;
    wave: number;
    gameState: 'MENU' | 'PREPARATION' | 'COMBAT' | 'GAMEOVER' | 'VICTORY';
    selectedBuilding: string | null;
    setGold: (val: number) => void;
    setEnergy: (val: number) => void;
    setBaseHp: (val: number, max?: number) => void;
    setWave: (val: number) => void;
    setGameState: (state: GameState['gameState']) => void;
    setSelectedBuilding: (b: string | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
    gold: 1000,
    energy: 500,
    researchPoints: 0,
    baseHp: 1000,
    maxBaseHp: 1000,
    wave: 1,
    gameState: 'MENU',
    selectedBuilding: null,
    setGold: (gold) => set({ gold }),
    setEnergy: (energy) => set({ energy }),
    setBaseHp: (baseHp, maxBaseHp) => set((state) => ({ baseHp, maxBaseHp: maxBaseHp || state.maxBaseHp })),
    setWave: (wave) => set({ wave }),
    setGameState: (gameState) => set({ gameState }),
    setSelectedBuilding: (selectedBuilding) => set({ selectedBuilding })
}));
