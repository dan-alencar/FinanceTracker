export const unlockAchievement = async (supabase, userId, code) => {
  const { data: achievement, error } = await supabase
    .from("achievements")
    .select("id, code")
    .eq("code", code)
    .single();

  if (error || !achievement) return;

  await supabase.from("user_achievements").upsert(
    {
      user_id: userId,
      achievement_id: achievement.id,
      unlocked_at: new Date().toISOString()
    },
    { onConflict: "user_id,achievement_id" }
  );
};

export const listAchievementsWithStatus = async (supabase, userId) => {
  const { data: achievements } = await supabase
    .from("achievements")
    .select("id, code, name, description, icon");

  const { data: unlocked } = await supabase
    .from("user_achievements")
    .select("achievement_id, unlocked_at")
    .eq("user_id", userId);

  const unlockedMap = new Map(
    (unlocked || []).map((entry) => [entry.achievement_id, entry.unlocked_at])
  );

  return (achievements || []).map((achievement) => ({
    ...achievement,
    unlocked_at: unlockedMap.get(achievement.id) || null
  }));
};
