import { Router } from "express";
import { getCurrentMonth, getMonthRange, getPreviousMonth } from "../services/dateUtils.js";
import { applyBudgetRewards } from "../services/gameState.js";
import { unlockAchievement } from "../services/achievements.js";

const BUDGET_BONUS_XP = Number(process.env.BUDGET_BONUS_XP ?? 300);
const BUDGET_BONUS_GOLD = Number(process.env.BUDGET_BONUS_GOLD ?? 150);

const createBudgetsRouter = ({ supabase }) => {
  const router = Router();

  router.use((req, res, next) => {
    if (!supabase) {
      res.status(501).json({
        error: "Supabase is not configured. Provide SUPABASE_URL and SUPABASE_SERVICE_KEY."
      });
      return;
    }
    next();
  });

  router.get("/current", async (req, res) => {
    const userId = req.header("x-user-id");
    if (!userId) {
      res.status(400).json({ error: "x-user-id header required" });
      return;
    }

    const timeZone = req.header("x-user-timezone") || "America/Sao_Paulo";
    const month = req.query.month || getCurrentMonth(timeZone);
    const { start, end } = getMonthRange(month);

    const { data: budgets, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month);

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount, category, occurred_at")
      .eq("user_id", userId)
      .gte("occurred_at", start)
      .lte("occurred_at", end);

    const spendByCategory = (transactions || []).reduce((acc, tx) => {
      const current = acc[tx.category] || 0;
      return { ...acc, [tx.category]: current + Math.abs(tx.amount) };
    }, {});

    const response = (budgets || []).map((budget) => {
      const spend = spendByCategory[budget.category] || 0;
      const progress =
        budget.limit_amount > 0
          ? Math.round((spend / budget.limit_amount) * 100)
          : 0;
      return {
        ...budget,
        spend,
        progress
      };
    });

    res.json({ month, budgets: response });
  });

  router.post("/", async (req, res) => {
    const userId = req.header("x-user-id");
    if (!userId) {
      res.status(400).json({ error: "x-user-id header required" });
      return;
    }

    const { month, category, limit_amount } = req.body;
    const { data, error } = await supabase
      .from("budgets")
      .upsert(
        {
          user_id: userId,
          month,
          category,
          limit_amount
        },
        { onConflict: "user_id,month,category" }
      )
      .select("*")
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({ budget: data });
  });

  router.patch("/:id", async (req, res) => {
    const userId = req.header("x-user-id");
    if (!userId) {
      res.status(400).json({ error: "x-user-id header required" });
      return;
    }

    const { id } = req.params;
    const { limit_amount } = req.body;
    const { data, error } = await supabase
      .from("budgets")
      .update({ limit_amount })
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ budget: data });
  });

  router.delete("/:id", async (req, res) => {
    const userId = req.header("x-user-id");
    if (!userId) {
      res.status(400).json({ error: "x-user-id header required" });
      return;
    }

    const { id } = req.params;
    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(204).send();
  });

  router.post("/finalize", async (req, res) => {
    const userId = req.header("x-user-id");
    if (!userId) {
      res.status(400).json({ error: "x-user-id header required" });
      return;
    }

    const timeZone = req.header("x-user-timezone") || "America/Sao_Paulo";
    const month = req.body.month || getPreviousMonth(timeZone);
    const { start, end } = getMonthRange(month);

    const { data: budgets } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month);

    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount, category, occurred_at")
      .eq("user_id", userId)
      .gte("occurred_at", start)
      .lte("occurred_at", end);

    const spendByCategory = (transactions || []).reduce((acc, tx) => {
      const current = acc[tx.category] || 0;
      return { ...acc, [tx.category]: current + Math.abs(tx.amount) };
    }, {});

    const { data: awards } = await supabase
      .from("budget_awards")
      .select("category")
      .eq("user_id", userId)
      .eq("month", month);

    const awardedCategories = new Set((awards || []).map((award) => award.category));
    const eligibleBudgets = (budgets || []).filter((budget) => {
      const spend = spendByCategory[budget.category] || 0;
      return spend <= budget.limit_amount && !awardedCategories.has(budget.category);
    });

    if (eligibleBudgets.length > 0) {
      const inserts = eligibleBudgets.map((budget) => ({
        user_id: userId,
        month,
        category: budget.category
      }));

      await supabase.from("budget_awards").insert(inserts);

      const bonusXp = eligibleBudgets.length * BUDGET_BONUS_XP;
      const bonusGold = eligibleBudgets.length * BUDGET_BONUS_GOLD;
      await applyBudgetRewards(supabase, userId, bonusXp, bonusGold);
    }

    if (eligibleBudgets.length >= 3) {
      await unlockAchievement(supabase, userId, "budget-keeper");
    }

    res.json({ month, awarded: eligibleBudgets.length });
  });

  return router;
};

export default createBudgetsRouter;
