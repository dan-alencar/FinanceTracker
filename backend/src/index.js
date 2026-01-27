import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createClient } from "@supabase/supabase-js";
import createBudgetsRouter from "./routes/budgets.js";
import createInventoryRouter from "./routes/inventory.js";
import createStatsRouter from "./routes/stats.js";
import createAchievementsRouter from "./routes/achievements.js";
import { applyTransactionRewards } from "./services/gameState.js";
import { unlockAchievement } from "./services/achievements.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const adminKey = process.env.ADMIN_API_KEY;
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const requireSupabase = (res) => {
  if (!supabase) {
    res.status(501).json({
      error: "Supabase is not configured. Provide SUPABASE_URL and SUPABASE_SERVICE_KEY."
    });
    return false;
  }
  return true;
};

const requireUser = (req, res) => {
  const userId = req.header("x-user-id");
  if (!userId) {
    res.status(400).json({ error: "x-user-id header required" });
    return null;
  }
  return userId;
};

const requireAdmin = (req, res) => {
  if (!adminKey) {
    res.status(501).json({ error: "Admin API key not configured." });
    return false;
  }
  const token = req.header("x-admin-key");
  if (!token || token !== adminKey) {
    res.status(403).json({ error: "Admin key required." });
    return false;
  }
  return true;
};

const getUserTimezone = async (userId) => {
  const { data } = await supabase
    .from("profiles")
    .select("settings, timezone")
    .eq("id", userId)
    .single();
  return data?.timezone || data?.settings?.timezone || "America/Sao_Paulo";
};

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "dwarven-guild" });
});

app.get("/me", async (req, res) => {
  if (!requireSupabase(res)) return;
  const userId = requireUser(req, res);
  if (!userId) return;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const { data: gameState } = await supabase
    .from("game_state")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (profileError) {
    res.status(404).json({ error: profileError.message });
    return;
  }

  res.json({ profile, gameState });
});

app.patch("/me/settings", async (req, res) => {
  if (!requireSupabase(res)) return;
  const userId = requireUser(req, res);
  if (!userId) return;

  const { settings } = req.body;
  const { data, error } = await supabase
    .from("profiles")
    .update({ settings })
    .eq("id", userId)
    .select("settings")
    .single();

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ settings: data.settings });
});

app.post("/avatar", async (req, res) => {
  if (!requireSupabase(res)) return;
  const userId = requireUser(req, res);
  if (!userId) return;

  const { classId, appearanceId, startingBalance } = req.body;
  const { data, error } = await supabase
    .from("profiles")
    .update({
      class: classId,
      appearance_id: appearanceId,
      starting_balance: startingBalance
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ profile: data });
});

app.post("/transactions", async (req, res) => {
  if (!requireSupabase(res)) return;
  const userId = requireUser(req, res);
  if (!userId) return;

  const { amount, category, occurredAt, note } = req.body;
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      amount,
      category,
      occurred_at: occurredAt,
      note
    })
    .select("*")
    .single();

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  const timezone = await getUserTimezone(userId);
  const gameState = await applyTransactionRewards(supabase, userId, timezone);

  const { count } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count === 1) {
    await unlockAchievement(supabase, userId, "first-log");
  }

  if (gameState?.streak_count >= 3) {
    await unlockAchievement(supabase, userId, "steady-hand");
  }

  if (gameState?.streak_count >= 7) {
    await unlockAchievement(supabase, userId, "streak-7");
  }

  if (count >= 50) {
    await unlockAchievement(supabase, userId, "guild-treasurer");
  }

  res.status(201).json({ transaction: data, gameState });
});

app.get("/transactions", async (req, res) => {
  if (!requireSupabase(res)) return;
  const userId = requireUser(req, res);
  if (!userId) return;

  const { from, to } = req.query;
  let query = supabase.from("transactions").select("*").eq("user_id", userId);
  if (from) query = query.gte("occurred_at", from);
  if (to) query = query.lte("occurred_at", to);

  const { data, error } = await query.order("occurred_at", { ascending: false });
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ transactions: data });
});

app.post("/missions", async (req, res) => {
  if (!requireSupabase(res)) return;
  const userId = requireUser(req, res);
  if (!userId) return;

  const { data: activeMissions } = await supabase
    .from("missions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active");

  if (activeMissions && activeMissions.length >= 3) {
    res.status(400).json({ error: "Max 3 active missions" });
    return;
  }

  const { title, targetAmount, rewardXp, rewardGold } = req.body;
  const { data, error } = await supabase
    .from("missions")
    .insert({
      user_id: userId,
      title,
      target_amount: targetAmount,
      current_amount: 0,
      status: "active",
      reward_xp: rewardXp,
      reward_gold: rewardGold
    })
    .select("*")
    .single();

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(201).json({ mission: data });
});

app.get("/missions", async (req, res) => {
  if (!requireSupabase(res)) return;
  const userId = requireUser(req, res);
  if (!userId) return;

  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ missions: data });
});

app.post("/missions/:id/complete", async (req, res) => {
  if (!requireSupabase(res)) return;
  const userId = requireUser(req, res);
  if (!userId) return;

  const { id } = req.params;
  const { data, error } = await supabase
    .from("missions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ mission: data });
});

app.get("/shop/items", async (_req, res) => {
  if (!requireSupabase(res)) return;
  const { data, error } = await supabase
    .from("shop_items")
    .select("*")
    .eq("is_active", true);

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ items: data });
});

app.post("/shop/buy", async (req, res) => {
  if (!requireSupabase(res)) return;
  const userId = requireUser(req, res);
  if (!userId) return;

  const { shopItemId } = req.body;
  const { data: item, error: itemError } = await supabase
    .from("shop_items")
    .select("id, price_gold")
    .eq("id", shopItemId)
    .single();

  if (itemError || !item) {
    res.status(400).json({ error: itemError?.message || "Invalid item" });
    return;
  }

  const { data: gameState } = await supabase
    .from("game_state")
    .select("gold")
    .eq("user_id", userId)
    .single();

  if (!gameState || gameState.gold < item.price_gold) {
    res.status(400).json({ error: "Insufficient gold" });
    return;
  }

  const { data: inventoryItem, error: inventoryError } = await supabase
    .from("inventory")
    .insert({ user_id: userId, shop_item_id: shopItemId })
    .select("*")
    .single();

  if (inventoryError) {
    res.status(400).json({ error: inventoryError.message });
    return;
  }

  await supabase.from("purchases").insert({ user_id: userId, shop_item_id: shopItemId });

  await supabase
    .from("game_state")
    .update({ gold: gameState.gold - item.price_gold })
    .eq("user_id", userId);

  const { count } = await supabase
    .from("inventory")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count >= 5) {
    await unlockAchievement(supabase, userId, "armory-collector");
  }

  res.status(201).json({ inventory: inventoryItem });
});

app.get("/counselor/messages", async (req, res) => {
  if (!requireSupabase(res)) return;
  const userId = requireUser(req, res);
  if (!userId) return;

  const { data, error } = await supabase
    .from("counselor_messages")
    .select("*")
    .eq("user_id", userId)
    .order("sent_at", { ascending: false });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ messages: data });
});

app.post("/counselor/messages/:id/read", async (req, res) => {
  if (!requireSupabase(res)) return;
  const userId = requireUser(req, res);
  if (!userId) return;

  const { id } = req.params;
  const { data, error } = await supabase
    .from("counselor_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ message: data });
});

app.post("/admin/counselor/send", async (req, res) => {
  if (!requireSupabase(res)) return;
  if (!requireAdmin(req, res)) return;

  const { userId, title, body, adminId } = req.body;
  const { data, error } = await supabase
    .from("counselor_messages")
    .insert({
      user_id: userId,
      title,
      body,
      created_by_admin: adminId,
      sent_at: new Date().toISOString()
    })
    .select("*")
    .single();

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(201).json({ message: data });
});

app.post("/events", async (req, res) => {
  if (!requireSupabase(res)) return;
  const userId = req.body.userId || null;
  const { name, props } = req.body;

  const { data, error } = await supabase
    .from("events")
    .insert({
      user_id: userId,
      name,
      props
    })
    .select("*")
    .single();

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(201).json({ event: data });
});

app.use("/budgets", createBudgetsRouter({ supabase }));
app.use("/", createInventoryRouter({ supabase }));
app.use("/stats", createStatsRouter({ supabase }));
app.use("/achievements", createAchievementsRouter({ supabase }));

app.listen(PORT, () => {
  console.log(`Dwarven Guild backend running on ${PORT}`);
});
