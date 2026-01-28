import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import CategoryIcon from "../components/CategoryIcon";
import { categories } from "../data/gameData";
import { getTodayString } from "../lib/dateUtils";
import { useGameStore } from "../store/useGameStore";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/apiClient";

export default function Transactions() {
  const { t } = useTranslation();
  const { settings, toggleSound } = useGameStore();
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("20");
  const [category, setCategory] = useState(categories[0]);
  const [note, setNote] = useState("");
  const [kind, setKind] = useState("expense");
  const [occurredAt, setOccurredAt] = useState(getTodayString(settings.timezone));
  const [showClink, setShowClink] = useState(false);
  const [error, setError] = useState("");

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1)),
    [transactions]
  );

  const fetchSummary = async () => {
    const data = await apiFetch("/api/finance/summary");
    setTransactions(
      data.transactions.map((entry) => ({
        id: entry.id,
        amount: entry.kind === "expense" ? -entry.amount_cents / 100 : entry.amount_cents / 100,
        category: entry.category,
        occurredAt: entry.occurred_at,
        note: entry.description
      }))
    );
  };

  useEffect(() => {
    fetchSummary().catch((err) => setError(err.message));
  }, []);

  const handleLog = async () => {
    setError("");
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError(t("transactions.invalidAmount"));
      return;
    }

    const payload = {
      amountCents: Math.round(numericAmount * 100),
      category,
      description: note || t("transactions.manualNote"),
      occurredAt: `${occurredAt}T00:00:00Z`,
      clientGeneratedId: crypto.randomUUID()
    };

    try {
      if (kind === "income") {
        await apiFetch("/api/finance/income", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch("/api/finance/expense", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }
      setNote("");
      await fetchSummary();
      if (!settings.discreteMode) {
        setShowClink(true);
        setTimeout(() => setShowClink(false), 800);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="page-title">{t("transactions.title")}</h1>
      <p className="subtitle">{t("transactions.subtitle")}</p>

      <div className="grid grid-2">
        <Card title={t("transactions.quickAdd")} subtitle={t("transactions.manualLogging")}>
          <label className="tag">{t("transactions.kind")}</label>
          <div className="toggle-group">
            <button
              type="button"
              className={kind === "expense" ? "button" : "button secondary"}
              onClick={() => setKind("expense")}
            >
              {t("transactions.expense")}
            </button>
            <button
              type="button"
              className={kind === "income" ? "button" : "button secondary"}
              onClick={() => setKind("income")}
            >
              {t("transactions.income")}
            </button>
          </div>
          <label className="tag">{t("transactions.amount")}</label>
          <input
            className="input"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <label className="tag">{t("transactions.date")}</label>
          <input
            className="input"
            type="date"
            value={occurredAt}
            onChange={(event) => setOccurredAt(event.target.value)}
          />
          <label className="tag">{t("transactions.category")}</label>
          <select
            className="input"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
          <label className="tag">{t("transactions.note")}</label>
          <input
            className="input"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <button className="button" onClick={handleLog}>
            {t("transactions.logEarn")}
          </button>
          <button className="button secondary" onClick={toggleSound}>
            {t("transactions.sound", {
              state: settings.soundOn
                ? t("transactions.soundOn")
                : t("transactions.soundOff")
            })}
          </button>
          {showClink && !settings.discreteMode && (
            <div className="clink">{t("transactions.clink")}</div>
          )}
          {error && <div className="badge error">{error}</div>}
        </Card>

        <Card title={t("transactions.recentLogs")} subtitle={t("transactions.latestTransactions")}>
          <div className="list">
            {sorted.map((tx) => (
              <div key={tx.id} className="tag">
                <CategoryIcon category={tx.category} /> {tx.category} · R${" "}
                {Math.abs(tx.amount)} · {tx.note}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
