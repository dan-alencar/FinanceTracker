import { useMemo, useState } from "react";
import Card from "../components/Card";
import CategoryIcon from "../components/CategoryIcon";
import { categories } from "../data/gameData";
import { getTodayString } from "../lib/dateUtils";
import { useGameStore } from "../store/useGameStore";
import { useTranslation } from "react-i18next";

export default function Transactions() {
  const { t } = useTranslation();
  const { addTransaction, transactions, settings, toggleSound } = useGameStore();
  const [amount, setAmount] = useState("20");
  const [category, setCategory] = useState(categories[0]);
  const [note, setNote] = useState("");
  const [showClink, setShowClink] = useState(false);

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1)),
    [transactions]
  );

  const handleLog = () => {
    addTransaction({
      id: `tx-${Date.now()}`,
      amount: -Math.abs(Number(amount) || 0),
      category,
      occurredAt: getTodayString(settings.timezone),
      note: note || t("transactions.manualNote")
    });
    setNote("");
    if (!settings.discreteMode) {
      setShowClink(true);
      setTimeout(() => setShowClink(false), 800);
    }
  };

  return (
    <div>
      <h1 className="page-title">{t("transactions.title")}</h1>
      <p className="subtitle">{t("transactions.subtitle")}</p>

      <div className="grid grid-2">
        <Card title={t("transactions.quickAdd")} subtitle={t("transactions.manualLogging")}>
          <label className="tag">{t("transactions.amount")}</label>
          <input
            className="input"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
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
