import { useMemo, useState } from "react";
import Card from "../components/Card";
import CategoryIcon from "../components/CategoryIcon";
import { categories } from "../data/gameData";
import { getTodayString } from "../lib/dateUtils";
import { useGameStore } from "../store/useGameStore";

export default function Transactions() {
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
      note: note || "Manual log"
    });
    setNote("");
    if (!settings.discreteMode) {
      setShowClink(true);
      setTimeout(() => setShowClink(false), 800);
    }
  };

  return (
    <div>
      <h1 className="page-title">Coin Ledger</h1>
      <p className="subtitle">Keypad logging with instant XP + gold rewards.</p>

      <div className="grid grid-2">
        <Card title="Quick Add" subtitle="Manual logging">
          <label className="tag">Amount (R$)</label>
          <input
            className="input"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <label className="tag">Category</label>
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
          <label className="tag">Note</label>
          <input
            className="input"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <button className="button" onClick={handleLog}>
            Log & Earn
          </button>
          <button className="button secondary" onClick={toggleSound}>
            Sound: {settings.soundOn ? "On" : "Off"}
          </button>
          {showClink && !settings.discreteMode && (
            <div className="clink">+XP · +Gold</div>
          )}
        </Card>

        <Card title="Recent Logs" subtitle="Latest transactions">
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
