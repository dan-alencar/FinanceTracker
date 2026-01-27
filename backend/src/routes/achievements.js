import { Router } from "express";
import { listAchievementsWithStatus } from "../services/achievements.js";

const createAchievementsRouter = ({ supabase }) => {
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

  router.get("/", async (req, res) => {
    const userId = req.header("x-user-id");
    if (!userId) {
      res.status(400).json({ error: "x-user-id header required" });
      return;
    }

    const achievements = await listAchievementsWithStatus(supabase, userId);
    res.json({ achievements });
  });

  return router;
};

export default createAchievementsRouter;
