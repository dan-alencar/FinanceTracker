import { create } from "zustand";
import {
  appearances,
  categories,
  classes,
  counselorMessages,
  shopItems
} from "../data/gameData";

const XP_PER_TX = 50;
const GOLD_PER_TX = 20;
const LEVEL_XP = 500;

const todayString = () => new Date().toISOString().split("T")[0];

export const useGameStore = create((set, get) => ({
  profile: {
    displayName: "Aria",
    classId: classes[0].id,
    appearanceId: appearances[0].id,
    startingBalance: 320
  },
  settings: {
    discreteMode: false
  },
  gameState: {
    xp: 120,
    level: 1,
    gold: 180,
    streakCount: 2,
    streakLastDate: todayString()
  },
  transactions: [
    {
      id: "tx-1",
      amount: -35,
      category: categories[0],
      occurredAt: todayString(),
      note: "Guild snacks"
    },
    {
      id: "tx-2",
      amount: -60,
      category: categories[2],
      occurredAt: todayString(),
      note: "Game credits"
    }
  ],
  missions: [
    {
      id: "m-1",
      title: "Save for a new headset",
      targetAmount: 300,
      currentAmount: 140,
      status: "active",
      rewardXp: 250,
      rewardGold: 100
    }
  ],
  counselorMessages: counselorMessages.map((message) => ({
    ...message,
    readAt: null
  })),
  shopItems,
  purchases: ["ring"],
  addTransaction: (transaction) => {
    const { gameState } = get();
    const newXp = gameState.xp + XP_PER_TX;
    const levelIncrease = Math.floor(newXp / LEVEL_XP);
    const nextLevelXp = newXp % LEVEL_XP;
    const today = todayString();
    const streakIncrement = gameState.streakLastDate === today ? 0 : 1;

    set((state) => ({
      transactions: [transaction, ...state.transactions],
      gameState: {
        xp: nextLevelXp,
        level: gameState.level + levelIncrease,
        gold: gameState.gold + GOLD_PER_TX,
        streakCount:
          streakIncrement === 0 ? gameState.streakCount : gameState.streakCount + 1,
        streakLastDate: today
      }
    }));
  },
  addMission: (mission) => {
    if (get().missions.filter((item) => item.status === "active").length >= 3) {
      return false;
    }
    set((state) => ({ missions: [mission, ...state.missions] }));
    return true;
  },
  completeMission: (missionId) => {
    const { gameState } = get();
    set((state) => ({
      missions: state.missions.map((mission) =>
        mission.id === missionId
          ? { ...mission, status: "completed" }
          : mission
      ),
      gameState: {
        ...gameState,
        xp: gameState.xp + 150,
        gold: gameState.gold + 80
      }
    }));
  },
  buyItem: (itemId) => {
    const { gameState, purchases } = get();
    const item = shopItems.find((entry) => entry.id === itemId);
    if (!item || purchases.includes(itemId) || gameState.gold < item.price) {
      return false;
    }
    set((state) => ({
      purchases: [...state.purchases, itemId],
      gameState: {
        ...state.gameState,
        gold: state.gameState.gold - item.price
      }
    }));
    return true;
  },
  markMessageRead: (messageId) => {
    set((state) => ({
      counselorMessages: state.counselorMessages.map((message) =>
        message.id === messageId && !message.readAt
          ? { ...message, readAt: new Date().toISOString() }
          : message
      )
    }));
  },
  toggleDiscreteMode: () => {
    set((state) => ({
      settings: {
        ...state.settings,
        discreteMode: !state.settings.discreteMode
      }
    }));
  }
}));
