import { Router } from "express";

const createInventoryRouter = ({ supabase }) => {
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

  router.get("/inventory", async (req, res) => {
    const userId = req.header("x-user-id");
    if (!userId) {
      res.status(400).json({ error: "x-user-id header required" });
      return;
    }

    const { data, error } = await supabase
      .from("inventory")
      .select("id, acquired_at, shop_items(*)")
      .eq("user_id", userId);

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ inventory: data });
  });

  router.get("/loadout", async (req, res) => {
    const userId = req.header("x-user-id");
    if (!userId) {
      res.status(400).json({ error: "x-user-id header required" });
      return;
    }

    const { data, error } = await supabase
      .from("equipment")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ loadout: data });
  });

  router.post("/equip", async (req, res) => {
    const userId = req.header("x-user-id");
    if (!userId) {
      res.status(400).json({ error: "x-user-id header required" });
      return;
    }

    const { slot, shop_item_id } = req.body;

    if (shop_item_id) {
      const { data: owned } = await supabase
        .from("inventory")
        .select("id")
        .eq("user_id", userId)
        .eq("shop_item_id", shop_item_id)
        .maybeSingle();

      if (!owned) {
        res.status(403).json({ error: "Item not owned" });
        return;
      }
    }

    const { data, error } = await supabase
      .from("equipment")
      .upsert(
        {
          user_id: userId,
          slot,
          shop_item_id,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id,slot" }
      )
      .select("*")
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ loadout: data });
  });

  return router;
};

export default createInventoryRouter;
