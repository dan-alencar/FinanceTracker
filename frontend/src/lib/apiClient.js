import { supabase } from "./supabaseClient";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const getAccessToken = async () => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
};

const getDemoUser = () => localStorage.getItem("dg_demo_user");

const getDemoState = (email) => {
  const stored = localStorage.getItem(`dg_demo_state_${email}`);
  if (stored) return JSON.parse(stored);
  return {
    accounts: {
      checking: 0,
      savings: 0
    },
    transactions: [],
    missions: []
  };
};

const setDemoState = (email, state) => {
  localStorage.setItem(`dg_demo_state_${email}`, JSON.stringify(state));
};

const buildDemoSummary = (state) => ({
  balances: [
    {
      id: "demo-checking",
      name: "Pouch",
      account_type: "checking",
      available_cents: state.accounts.checking
    },
    {
      id: "demo-savings",
      name: "Vault",
      account_type: "savings",
      available_cents: state.accounts.savings
    }
  ],
  transactions: state.transactions.slice(-10).reverse(),
  missions: state.missions
});

const demoApiFetch = async (path, options = {}) => {
  const email = getDemoUser();
  if (!email) {
    throw new Error("Missing demo user");
  }
  const state = getDemoState(email);
  const method = (options.method || "GET").toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  const now = new Date().toISOString();

  if (path === "/avatar" && method === "POST") {
    const profile = {
      class_key: body.classId,
      appearance_id: body.appearanceId,
      starting_balance_cents: body.startingBalanceCents
    };
    localStorage.setItem(`dg_demo_profile_${email}`, JSON.stringify(profile));
    return { profile };
  }

  if (path === "/api/finance/initialize" && method === "POST") {
    state.accounts.checking = body.initialBalanceCents ?? 0;
    state.accounts.savings = 0;
    setDemoState(email, state);
    return { accounts: buildDemoSummary(state).balances };
  }

  if (path === "/api/finance/income" && method === "POST") {
    const entry = {
      id: crypto.randomUUID(),
      kind: "income",
      amount_cents: body.amountCents,
      category: body.category,
      description: body.description,
      occurred_at: body.occurredAt || now
    };
    state.transactions.push(entry);
    state.accounts.checking += body.amountCents;
    setDemoState(email, state);
    return { transaction: entry };
  }

  if (path === "/api/finance/expense" && method === "POST") {
    const entry = {
      id: crypto.randomUUID(),
      kind: "expense",
      amount_cents: body.amountCents,
      category: body.category,
      description: body.description,
      occurred_at: body.occurredAt || now
    };
    state.transactions.push(entry);
    state.accounts.checking -= body.amountCents;
    setDemoState(email, state);
    return { transaction: entry };
  }

  if (path === "/api/finance/savings/deposit" && method === "POST") {
    const entry = {
      id: crypto.randomUUID(),
      kind: "savings_deposit",
      amount_cents: body.amountCents,
      category: null,
      description: "Savings deposit",
      occurred_at: now
    };
    state.transactions.push(entry);
    state.accounts.checking -= body.amountCents;
    state.accounts.savings += body.amountCents;
    if (body.missionId) {
      state.missions = state.missions.map((mission) => {
        if (mission.id !== body.missionId) return mission;
        const nextSaved = (mission.saved_cents || 0) + body.amountCents;
        return {
          ...mission,
          saved_cents: nextSaved,
          status: nextSaved >= mission.target_cents ? "completed" : mission.status
        };
      });
    }
    setDemoState(email, state);
    return { transfer: entry };
  }

  if (path === "/api/finance/savings/withdraw" && method === "POST") {
    const entry = {
      id: crypto.randomUUID(),
      kind: "savings_withdraw",
      amount_cents: body.amountCents,
      category: null,
      description: "Savings withdraw",
      occurred_at: now
    };
    state.transactions.push(entry);
    state.accounts.checking += body.amountCents;
    state.accounts.savings -= body.amountCents;
    setDemoState(email, state);
    return { transfer: entry };
  }

  if (path === "/api/finance/summary" && method === "GET") {
    return buildDemoSummary(state);
  }

  if (path === "/missions" && method === "GET") {
    return { missions: state.missions.slice().reverse() };
  }

  if (path === "/missions" && method === "POST") {
    const mission = {
      id: crypto.randomUUID(),
      title: body.title,
      target_cents: body.targetCents,
      saved_cents: 0,
      status: "active",
      created_at: now
    };
    state.missions.push(mission);
    setDemoState(email, state);
    return { mission };
  }

  if (path.startsWith("/missions/") && path.endsWith("/complete") && method === "POST") {
    const missionId = path.split("/")[2];
    state.missions = state.missions.map((mission) =>
      mission.id === missionId ? { ...mission, status: "completed" } : mission
    );
    setDemoState(email, state);
    const mission = state.missions.find((entry) => entry.id === missionId);
    return { mission };
  }

  throw new Error("Unsupported demo request");
};

export const apiFetch = async (path, options = {}) => {
  const token = await getAccessToken();
  if (!token) {
    if (getDemoUser()) {
      return demoApiFetch(path, options);
    }
    throw new Error("Missing auth token");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Request failed");
  }

  return response.json();
};
