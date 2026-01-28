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
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const adminKey = process.env.ADMIN_API_KEY;
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;
const supabasePublic = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const requireSupabase = (res) => {
  if (!supabaseAdmin) {
    res.status(501).json({
      error: "Supabase is not configured. Provide SUPABASE_URL and SUPABASE_SERVICE_KEY."
    });
    return false;
  }
  return true;
};

const createUserClient = (token) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

const getUserClient = async (req, res) => {
  if (!requireSupabase(res)) return null;
  if (!supabaseAnonKey) {
    res.status(501).json({ error: "SUPABASE_ANON_KEY is required for user sessions." });
    return null;
  }
  const authHeader = req.header("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : null;
  if (!token) {
    res.status(401).json({ error: "Authorization token required." });
    return null;
  }
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    res.status(401).json({ error: "Invalid auth token." });
    return null;
  }
  return { user: data.user, client: createUserClient(token) };
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

const getUserTimezone = async (client, userId) => {
  const { data } = await client
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
  const session = await getUserClient(req, res);
  if (!session) return;
  const { user, client } = session;
  const userId = user.id;

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const { data: gameState } = await client
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
  const session = await getUserClient(req, res);
  if (!session) return;
  const { user, client } = session;
  const userId = user.id;

  const { settings } = req.body;
  const { data, error } = await client
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
  const session = await getUserClient(req, res);
  if (!session) return;
  const { user, client } = session;
  const userId = user.id;

  const { classId, appearanceId, startingBalanceCents } = req.body;
  const { data, error } = await client
    .from("profiles")
    .update({
      class_key: classId,
      appearance_id: appearanceId,
      starting_balance_cents: startingBalanceCents
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

app.post("/api/finance/initialize", async (req, res) => {
  const session = await getUserClient(req, res);
  if (!session) return;
  const { client } = session;
  const { initialBalanceCents } = req.body;

  if (!Number.isFinite(initialBalanceCents) || initialBalanceCents < 0) {
    res.status(400).json({ error: "initialBalanceCents must be >= 0" });
    return;
  }

  const { data, error } = await client.rpc("rpc_initialize_accounts", {
    p_initial_balance_cents: initialBalanceCents
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(201).json({ accounts: data });
});

app.post("/api/finance/income", async (req, res) => {
  const session = await getUserClient(req, res);
  if (!session) return;
  const { client } = session;
  const { amountCents, description, occurredAt, category, clientGeneratedId } = req.body;

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    res.status(400).json({ error: "amountCents must be > 0" });
    return;
  }

  const { data, error } = await client.rpc("rpc_create_income", {
    p_amount_cents: amountCents,
    p_description: description,
    p_occurred_at: occurredAt,
    p_category: category,
    p_client_generated_id: clientGeneratedId
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(201).json({ transaction: data });
});

app.post("/api/finance/expense", async (req, res) => {
  const session = await getUserClient(req, res);
  if (!session) return;
  const { client } = session;
  const { amountCents, description, occurredAt, category, clientGeneratedId } = req.body;

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    res.status(400).json({ error: "amountCents must be > 0" });
    return;
  }

  const { data, error } = await client.rpc("rpc_create_expense", {
    p_amount_cents: amountCents,
    p_description: description,
    p_occurred_at: occurredAt,
    p_category: category,
    p_client_generated_id: clientGeneratedId
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(201).json({ transaction: data });
});

app.post("/api/finance/savings/deposit", async (req, res) => {
  const session = await getUserClient(req, res);
  if (!session) return;
  const { client } = session;
  const { amountCents, missionId, clientGeneratedId } = req.body;

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    res.status(400).json({ error: "amountCents must be > 0" });
    return;
  }

  const { data, error } = await client.rpc("rpc_deposit_to_savings", {
    p_amount_cents: amountCents,
    p_mission_id: missionId,
    p_client_generated_id: clientGeneratedId
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(201).json({ transfer: data });
});

app.post("/api/finance/savings/withdraw", async (req, res) => {
  const session = await getUserClient(req, res);
  if (!session) return;
  const { client } = session;
  const { amountCents, clientGeneratedId } = req.body;

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    res.status(400).json({ error: "amountCents must be > 0" });
    return;
  }

  const { data, error } = await client.rpc("rpc_withdraw_from_savings", {
    p_amount_cents: amountCents,
    p_client_generated_id: clientGeneratedId
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(201).json({ transfer: data });
});

app.get("/api/finance/summary", async (req, res) => {
  const session = await getUserClient(req, res);
  if (!session) return;
  const { user, client } = session;
  const userId = user.id;

  const { data: accounts } = await client
    .from("accounts")
    .select("id, name, account_type")
    .eq("user_id", userId);

  const accountIds = accounts?.map((account) => account.id) || [];
  const balancesResponse = accountIds.length
    ? await client
        .from("balances")
        .select("account_id, available_cents")
        .in("account_id", accountIds)
    : { data: [] };
  const balances = balancesResponse.data;

  const { data: transactions } = await client
    .from("transactions")
    .select("id, kind, amount_cents, category, description, occurred_at")
    .eq("user_id", userId)
    .order("occurred_at", { ascending: false })
    .limit(10);

  const { data: missions } = await client
    .from("missions")
    .select("id, title, target_cents, saved_cents, status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  res.json({
    balances: (accounts || []).map((account) => {
      const balance = balances?.find((entry) => entry.account_id === account.id);
      return {
        ...account,
        available_cents: balance?.available_cents ?? 0
      };
    }),
    transactions: transactions || [],
    missions: missions || []
  });
});

app.post("/transactions", async (req, res) => {
  const session = await getUserClient(req, res);
  if (!session) return;
  const { user, client } = session;
  const userId = user.id;

  const { amountCents, category, occurredAt, description, kind, clientGeneratedId } = req.body;
  const { data, error } = await client.rpc("rpc_create_transaction", {
    p_amount_cents: amountCents,
    p_category: category,
    p_description: description,
    p_occurred_at: occurredAt,
    p_kind: kind,
    p_client_generated_id: clientGeneratedId
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  const timezone = await getUserTimezone(client, userId);
  const gameState = await applyTransactionRewards(client, userId, timezone);

  const { count } = await client
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count === 1) {
    await unlockAchievement(client, userId, "first-log");
  }

  if (gameState?.streak_count >= 3) {
    await unlockAchievement(client, userId, "steady-hand");
  }

  if (gameState?.streak_count >= 7) {
    await unlockAchievement(client, userId, "streak-7");
  }

  if (count >= 50) {
    await unlockAchievement(client, userId, "guild-treasurer");
  }

  res.status(201).json({ transaction: data, gameState });
});

app.get("/transactions", async (req, res) => {
  const session = await getUserClient(req, res);
  if (!session) return;
  const { user, client } = session;
  const userId = user.id;

  const { from, to } = req.query;
  let query = client.from("transactions").select("*").eq("user_id", userId);
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
  const session = await getUserClient(req, res);
  if (!session) return;
  const { user, client } = session;
  const userId = user.id;

  const { data: activeMissions } = await client
    .from("missions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active");

  if (activeMissions && activeMissions.length >= 3) {
    res.status(400).json({ error: "Max 3 active missions" });
    return;
  }

  const { title, targetCents } = req.body;
  const { data, error } = await client
    .from("missions")
    .insert({
      user_id: userId,
      title,
      target_cents: targetCents,
      saved_cents: 0,
      status: "active"
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
  const session = await getUserClient(req, res);
  if (!session) return;
  const { user, client } = session;
  const userId = user.id;

  const { data, error } = await client
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
  const session = await getUserClient(req, res);
  if (!session) return;
  const { user, client } = session;
  const userId = user.id;

  const { id } = req.params;
  const { data, error } = await client
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
  if (!supabasePublic) {
    res.status(501).json({ error: "Supabase public client not configured." });
    return;
  }
  const { data, error } = await supabasePublic
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
  const session = await getUserClient(req, res);
  if (!session) return;
  const { user, client } = session;
  const userId = user.id;

  const { shopItemId } = req.body;
  const { data: item, error: itemError } = await client
    .from("shop_items")
    .select("id, price_gold")
    .eq("id", shopItemId)
    .single();

  if (itemError || !item) {
    res.status(400).json({ error: itemError?.message || "Invalid item" });
    return;
  }

  const { data: gameState } = await client
    .from("game_state")
    .select("gold")
    .eq("user_id", userId)
    .single();

  if (!gameState || gameState.gold < item.price_gold) {
    res.status(400).json({ error: "Insufficient gold" });
    return;
  }

  const { data: inventoryItem, error: inventoryError } = await client
    .from("inventory")
    .insert({ user_id: userId, shop_item_id: shopItemId })
    .select("*")
    .single();

  if (inventoryError) {
    res.status(400).json({ error: inventoryError.message });
    return;
  }

  await client.from("purchases").insert({ user_id: userId, shop_item_id: shopItemId });

  await client
    .from("game_state")
    .update({ gold: gameState.gold - item.price_gold })
    .eq("user_id", userId);

  const { count } = await client
    .from("inventory")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count >= 5) {
    await unlockAchievement(client, userId, "armory-collector");
  }

  res.status(201).json({ inventory: inventoryItem });
});

app.get("/counselor/messages", async (req, res) => {
  const session = await getUserClient(req, res);
  if (!session) return;
  const { user, client } = session;
  const userId = user.id;

  const { data, error } = await client
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
  const session = await getUserClient(req, res);
  if (!session) return;
  const { user, client } = session;
  const userId = user.id;

  const { id } = req.params;
  const { data, error } = await client
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
  const { data, error } = await supabaseAdmin
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

  const { data, error } = await supabaseAdmin
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

app.use("/budgets", createBudgetsRouter({ supabase: supabaseAdmin }));
app.use("/", createInventoryRouter({ supabase: supabaseAdmin }));
app.use("/stats", createStatsRouter({ supabase: supabaseAdmin }));
app.use("/achievements", createAchievementsRouter({ supabase: supabaseAdmin }));

app.listen(PORT, () => {
  console.log(`Dwarven Guild backend running on ${PORT}`);
});
