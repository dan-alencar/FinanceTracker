import { useMemo, useState } from "react";
import Card from "../components/Card";
import ProgressBar from "../components/ProgressBar";
import CategoryIcon from "../components/CategoryIcon";
import { categories } from "../data/gameData";
import { getCurrentMonth, getPreviousMonth } from "../lib/dateUtils";
import { useGameStore } from "../store/useGameStore";

export default function Budgets() {
  const {
    budgets,
    transactions,
    settings,
    addBudget,
    setBudget,
    finalizeBudgets,
    budgetAwards
  } = useGameStore();
  const currentMonth = getCurrentMonth(settings.timezone);
  const previousMonth = getPreviousMonth(settings.timezone);
  const [month, setMonth] = useState(currentMonth);

  const monthBudgets = useMemo(
    () => budgets.filter((budget) => budget.month === month),
    [budgets, month]
  );

  const getSpend = (category) =>
    transactions
      .filter((tx) => tx.category === category && tx.occurredAt.slice(0, 7) === month)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const handleBudgetChange = (category, value) => {
    const limit = Number(value);
    const existing = monthBudgets.find((budget) => budget.category === category);
    if (existing) {
      setBudget(category, limit, month);
    } else {
      addBudget(category, limit, month);
    }
  };

  return (
    <div>
      <h1 className="page-title">Monthly Quests</h1>
      <p className="subtitle">
        Set a spending limit per category to earn monthly bonus rewards.
      </p>

      <div className="grid grid-2">
        <Card title="Quest Settings" subtitle="Edit your monthly limits">
          <label className="tag">Month (YYYY-MM)</label>
          <input
            className="input"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
          <div className="list">
            {categories.map((category) => {
              const budget = monthBudgets.find((entry) => entry.category === category);
              return (
                <div key={category} className="budget-row">
                  <span className="budget-label">
                    <CategoryIcon category={category} /> {category}
                  </span>
                  <input
                    className="input"
                    type="number"
                    value={budget?.limitAmount ?? ""}
                    onChange={(event) =>
                      handleBudgetChange(category, event.target.value)
                    }
                    placeholder="Limit (R$)"
                  />
                </div>
              );
            })}
          </div>
          <button
            className="button secondary"
            onClick={() => finalizeBudgets(previousMonth)}
          >
            Finalize {previousMonth}
          </button>
        </Card>

        <Card title="Quest Progress" subtitle={`Tracking for ${month}`}>
          <div className="list">
            {categories.map((category) => {
              const budget = monthBudgets.find((entry) => entry.category === category);
              const spend = getSpend(category);
              const percent = budget
                ? Math.min(120, Math.round((spend / budget.limitAmount) * 100))
                : 0;
              return (
                <div key={category} className="budget-progress">
                  <div className="budget-label">
                    <CategoryIcon category={category} />
                    <span>{category}</span>
                    <span className="tag">
                      R$ {spend} / {budget?.limitAmount ?? 0}
                    </span>
                  </div>
                  <ProgressBar
                    value={Number.isFinite(percent) ? percent : 0}
                    label="Quest Meter"
                  />
                </div>
              );
            })}
          </div>
          {budgetAwards.length > 0 && (
            <div className="award-list">
              <p className="subtitle">Recent rewards forged</p>
              {budgetAwards.slice(-3).map((award) => (
                <span key={`${award.month}-${award.category}`} className="badge">
                  {award.category} · {award.month}
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
