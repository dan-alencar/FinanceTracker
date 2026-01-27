import { getTodayString, getYesterdayString } from "./dateUtils.js";

const XP_PER_TX = Number(process.env.XP_PER_TX ?? 50);
const GOLD_PER_TX = Number(process.env.GOLD_PER_TX ?? 20);
const LEVEL_XP = Number(process.env.LEVEL_XP ?? 500);

export const applyTransactionRewards = async (supabase, userId, timeZone) => {
  const { data: gameState } = await supabase
    .from("game_state")
    .select("*")
    .eq("user_id", userId)
    .single();

  const today = getTodayString(timeZone);
  const yesterday = getYesterdayString(timeZone);
  const streakLastDate = gameState?.streak_last_date;
  const isSameDay = streakLastDate === today;
  const shouldIncrement = streakLastDate === yesterday;
  const streakCount = isSameDay
    ? gameState?.streak_count ?? 0
    : shouldIncrement
      ? (gameState?.streak_count ?? 0) + 1
      : 1;

  const newXpTotal = (gameState?.xp ?? 0) + XP_PER_TX;
  const levelIncrease = Math.floor(newXpTotal / LEVEL_XP);
  const nextXp = newXpTotal % LEVEL_XP;

  const updated = {
    user_id: userId,
    xp: nextXp,
    level: (gameState?.level ?? 1) + levelIncrease,
    gold: (gameState?.gold ?? 0) + GOLD_PER_TX,
    streak_count: streakCount,
    streak_last_date: today,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("game_state")
    .upsert(updated, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const applyBudgetRewards = async (
  supabase,
  userId,
  bonusXp,
  bonusGold
) => {
  const { data: gameState } = await supabase
    .from("game_state")
    .select("*")
    .eq("user_id", userId)
    .single();

  const totalXp = (gameState?.xp ?? 0) + bonusXp;
  const levelIncrease = Math.floor(totalXp / LEVEL_XP);
  const nextXp = totalXp % LEVEL_XP;

  const updated = {
    user_id: userId,
    xp: nextXp,
    level: (gameState?.level ?? 1) + levelIncrease,
    gold: (gameState?.gold ?? 0) + bonusGold,
    streak_count: gameState?.streak_count ?? 0,
    streak_last_date: gameState?.streak_last_date ?? null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from("game_state")
    .upsert(updated, { onConflict: "user_id" });

  if (error) {
    throw new Error(error.message);
  }
};
