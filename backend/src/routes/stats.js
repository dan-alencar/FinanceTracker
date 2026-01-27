import { Router } from "express";

const rangeMap = {
  "7d": 7,
  "30d": 30
};

const createStatsRouter = ({ supabase }) => {
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

  router.get("/summary", async (req, res) => {
    const userId = req.header("x-user-id");
    if (!userId) {
      res.status(400).json({ error: "x-user-id header required" });
      return;
    }

    const range = req.query.range || "7d";
    const days = rangeMap[range] || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const start = startDate.toISOString().split("T")[0];

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("amount, category, occurred_at")
      .eq("user_id", userId)
      .gte("occurred_at", start);

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    const totalsByCategory = (transactions || []).reduce((acc, tx) => {
      const current = acc[tx.category] || 0;
      return { ...acc, [tx.category]: current + Math.abs(tx.amount) };
    }, {});

    const totalSpend = Object.values(totalsByCategory).reduce(
      (sum, value) => sum + value,
      0
    );
    const topCategory = Object.entries(totalsByCategory).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];

    res.json({
      totalSpend,
      totalsByCategory,
      txCount: transactions?.length ?? 0,
      topCategory: topCategory || null
    });
  });

  return router;
};

export default createStatsRouter;
