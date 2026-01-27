import { useMemo, useState } from "react";
import Card from "../components/Card";
import ProgressBar from "../components/ProgressBar";
import CategoryIcon from "../components/CategoryIcon";
import { categories } from "../data/gameData";
import { useGameStore } from "../store/useGameStore";
import { useTranslation } from "react-i18next";

const ranges = [
  { id: "7d", labelKey: "insights.range7", days: 7 },
  { id: "30d", labelKey: "insights.range30", days: 30 }
];

export default function Insights() {
  const { t } = useTranslation();
  const { transactions } = useGameStore();
  const [range, setRange] = useState("7d");

  const summary = useMemo(() => {
    const selected = ranges.find((entry) => entry.id === range) || ranges[0];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - selected.days);
    const filtered = transactions.filter((tx) => {
      const txDate = new Date(`${tx.occurredAt}T00:00:00`);
      return txDate >= cutoff;
    });

    const totalsByCategory = categories.reduce(
      (acc, category) => ({ ...acc, [category]: 0 }),
      {}
    );
    filtered.forEach((tx) => {
      totalsByCategory[tx.category] += Math.abs(tx.amount);
    });
    const totalSpend = Object.values(totalsByCategory).reduce(
      (sum, value) => sum + value,
      0
    );
    const topCategory = Object.entries(totalsByCategory).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];

    return {
      totalSpend,
      totalsByCategory,
      txCount: filtered.length,
      topCategory
    };
  }, [range, transactions]);

  return (
    <div>
      <h1 className="page-title">{t("insights.title")}</h1>
      <p className="subtitle">{t("insights.subtitle")}</p>

      <div className="toggle-group">
        {ranges.map((option) => (
          <button
            key={option.id}
            className={range === option.id ? "button" : "button secondary"}
            onClick={() => setRange(option.id)}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <Card title={t("insights.summary")} subtitle={t("insights.snapshot")}>
          <div className="list">
            <div className="tag">
              {t("insights.totalSpend", { value: summary.totalSpend })}
            </div>
            <div className="tag">
              {t("insights.transactions", { count: summary.txCount })}
            </div>
            <div className="tag">
              {t("insights.topCategory", {
                category: summary.topCategory || t("insights.none")
              })}
            </div>
          </div>
        </Card>

        <Card title={t("insights.breakdown")} subtitle={t("insights.spendByCategory")}>
          <div className="list">
            {categories.map((category) => {
              const amount = summary.totalsByCategory[category] || 0;
              const percent = summary.totalSpend
                ? Math.round((amount / summary.totalSpend) * 100)
                : 0;
              return (
                <div key={category} className="insight-row">
                  <div className="budget-label">
                    <CategoryIcon category={category} />
                    <span>{category}</span>
                    <span className="tag">R$ {amount}</span>
                  </div>
                  <ProgressBar value={percent} label={t("insights.share")} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
