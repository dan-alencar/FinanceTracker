import { create } from "zustand";
import {
  appearances,
  achievements,
  categories,
  classes,
  counselorMessages,
  shopItems
} from "../data/gameData";
import {
  getCurrentMonth,
  getTodayString,
  getYesterdayString
} from "../lib/dateUtils";

const XP_PER_TX = 50;
const GOLD_PER_TX = 20;
const LEVEL_XP = 500;
const BUDGET_BONUS_XP = 300;
const BUDGET_BONUS_GOLD = 150;

const defaultTimezone = "America/Sao_Paulo";

export const useGameStore = create((set, get) => ({
  profile: {
    displayName: "Aria",
    classId: classes[0].id,
    appearanceId: appearances[0].id,
    startingBalance: 320,
    titleCode: null
  },
  settings: {
    discreteMode: false,
    timezone: defaultTimezone,
    soundOn: false
  },
  gameState: {
    xp: 120,
    level: 1,
    gold: 180,
    streakCount: 2,
    streakLastDate: getTodayString(defaultTimezone)
  },
  transactions: [
    {
      id: "tx-1",
      amount: -35,
      category: categories[0],
      occurredAt: getTodayString(defaultTimezone),
      note: "Guild snacks"
    },
    {
      id: "tx-2",
      amount: -60,
      category: categories[2],
      occurredAt: getTodayString(defaultTimezone),
      note: "Game credits"
    }
  ],
  budgets: categories.map((category) => ({
    id: `budget-${category.toLowerCase()}`,
    month: getCurrentMonth(defaultTimezone),
    category,
    limitAmount: 200
  })),
  budgetAwards: [],
  budgetAlertFlags: {},
  notifications: [
    {
      id: "welcome-alert",
      type: "info",
      message: "The forge is hot. Log a coin today to keep your streak alive."
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
  inventory: ["ring"],
  loadout: {
    helmet: null,
    cloak: null,
    tool: null,
    background: null,
    accessory: "ring"
  },
  achievements,
  userAchievements: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 6)
    })),
  unlockAchievement: (code) => {
    const { userAchievements, achievements: allAchievements } = get();
    if (userAchievements.find((entry) => entry.code === code)) return;
    const achievement = allAchievements.find((entry) => entry.code === code);
    if (!achievement) return;
    set((state) => ({
      userAchievements: [
        { ...achievement, unlockedAt: new Date().toISOString() },
        ...state.userAchievements
      ]
    }));
  },
  equipTitle: (titleCode) =>
    set((state) => ({
      profile: {
        ...state.profile,
        titleCode
      }
    })),
  addTransaction: (transaction) => {
    const { gameState, settings, transactions, budgets } = get();
    const newXp = gameState.xp + XP_PER_TX;
    const levelIncrease = Math.floor(newXp / LEVEL_XP);
    const nextLevelXp = newXp % LEVEL_XP;
    const today = getTodayString(settings.timezone);
    const yesterday = getYesterdayString(settings.timezone);
    const lastDate = gameState.streakLastDate;
    const shouldIncrement = lastDate === yesterday;
    const isSameDay = lastDate === today;
    const nextStreakCount = isSameDay
      ? gameState.streakCount
      : shouldIncrement
        ? gameState.streakCount + 1
        : 1;

    const month = today.slice(0, 7);
    const budget = budgets.find(
      (entry) => entry.month === month && entry.category === transaction.category
    );
    const updatedTransactions = [transaction, ...transactions];
    const totalSpend = updatedTransactions
      .filter(
        (entry) =>
          entry.category === transaction.category &&
          entry.occurredAt.slice(0, 7) === month
      )
      .reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
    const progress = budget ? Math.round((totalSpend / budget.limitAmount) * 100) : 0;

    set((state) => ({
      transactions: updatedTransactions,
      gameState: {
        xp: nextLevelXp,
        level: gameState.level + levelIncrease,
        gold: gameState.gold + GOLD_PER_TX,
        streakCount: nextStreakCount,
        streakLastDate: today
      }
    }));

    if (transactions.length === 0) {
      get().unlockAchievement("first-log");
    }

    if (nextStreakCount >= 3) {
      get().unlockAchievement("steady-hand");
    }

    if (nextStreakCount >= 7) {
      get().unlockAchievement("streak-7");
    }

    if (updatedTransactions.length >= 50) {
      get().unlockAchievement("guild-treasurer");
    }

    if (budget && progress >= 80) {
      const threshold = progress >= 100 ? 100 : 80;
      const alertKey = `${budget.month}-${budget.category}-${threshold}`;
      if (!get().budgetAlertFlags[alertKey]) {
        set((state) => ({
          budgetAlertFlags: { ...state.budgetAlertFlags, [alertKey]: true }
        }));
        get().addNotification({
          id: `budget-${alertKey}`,
          type: threshold === 100 ? "warning" : "info",
          message: `Budget quest: ${budget.category} at ${threshold}% of the monthly limit.`
        });
      }
    }
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
    const { gameState, inventory } = get();
    const item = shopItems.find((entry) => entry.id === itemId);
    if (!item || inventory.includes(itemId) || gameState.gold < item.price) {
      return false;
    }
    set((state) => ({
      inventory: [...state.inventory, itemId],
      gameState: {
        ...state.gameState,
        gold: state.gameState.gold - item.price
      }
    }));
    if (get().inventory.length + 1 >= 5) {
      get().unlockAchievement("armory-collector");
    }
    return true;
  },
  equipItem: (slot, itemId) => {
    const { inventory } = get();
    if (itemId && !inventory.includes(itemId)) return false;
    set((state) => ({
      loadout: {
        ...state.loadout,
        [slot]: itemId
      }
    }));
    return true;
  },
  setBudget: (category, limitAmount, month) => {
    set((state) => ({
      budgets: state.budgets.map((budget) =>
        budget.category === category && budget.month === month
          ? { ...budget, limitAmount }
          : budget
      )
    }));
  },
  addBudget: (category, limitAmount, month) => {
    const budgetId = `budget-${category}-${month}`;
    set((state) => ({
      budgets: [
        ...state.budgets.filter(
          (budget) => !(budget.category === category && budget.month === month)
        ),
        {
          id: budgetId,
          category,
          month,
          limitAmount
        }
      ]
    }));
  },
  finalizeBudgets: (month) => {
    const { budgets, budgetAwards, transactions } = get();
    const monthBudgets = budgets.filter((budget) => budget.month === month);
    let awardedCount = 0;
    monthBudgets.forEach((budget) => {
      const alreadyAwarded = budgetAwards.find(
        (award) => award.month === month && award.category === budget.category
      );
      if (alreadyAwarded) return;
      const spend = transactions
        .filter(
          (tx) =>
            tx.category === budget.category && tx.occurredAt.slice(0, 7) === month
        )
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      if (spend <= budget.limitAmount) {
        awardedCount += 1;
        set((state) => ({
          budgetAwards: [
            ...state.budgetAwards,
            { month, category: budget.category }
          ],
          gameState: {
            ...state.gameState,
            xp: state.gameState.xp + BUDGET_BONUS_XP,
            gold: state.gameState.gold + BUDGET_BONUS_GOLD
          }
        }));
      }
    });

    if (awardedCount >= 3) {
      get().unlockAchievement("budget-keeper");
    }
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
  },
  toggleSound: () => {
    set((state) => ({
      settings: {
        ...state.settings,
        soundOn: !state.settings.soundOn
      }
    }));
  },
  setTimezone: (timezone) => {
    set((state) => ({
      settings: {
        ...state.settings,
        timezone
      }
    }));
  }
}));
