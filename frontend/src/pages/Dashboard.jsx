import { useEffect, useState } from "react";
import Card from "../components/Card";
import ProgressBar from "../components/ProgressBar";
import CategoryIcon from "../components/CategoryIcon";
import AvatarRenderer from "../components/AvatarRenderer";
import { getCurrentMonth } from "../lib/dateUtils";
import { useGameStore } from "../store/useGameStore";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/apiClient";

export default function Dashboard() {
  const { t } = useTranslation();
  const {
    profile,
    gameState,
    transactions,
    settings,
    toggleDiscreteMode,
    budgets,
    loadout,
    userAchievements,
    achievements,
    notifications,
    shopItems
  } = useGameStore();
  const [summary, setSummary] = useState({ balances: [], missions: [], transactions: [] });
  const [summaryError, setSummaryError] = useState("");
  const recent =
    summary.transactions?.length > 0
      ? summary.transactions.slice(0, 3).map((entry) => ({
          id: entry.id,
          category: entry.category,
          note: entry.description,
          amount: entry.kind === "expense" ? -entry.amount_cents / 100 : entry.amount_cents / 100
        }))
      : transactions.slice(0, 3);
  const healthScore = Math.min(100, Math.round(gameState.streakCount * 12 + 40));
  const currentMonth = getCurrentMonth(settings.timezone);
  const monthBudgets = budgets.filter((budget) => budget.month === currentMonth);
  const titleLabel =
    achievements.find((entry) => entry.code === profile.titleCode)?.title || null;
  const latestAchievements = userAchievements.slice(0, 3);
  const equippedAssets = Object.entries(loadout).reduce((acc, [slot, itemId]) => {
    const item = shopItems.find((entry) => entry.id === itemId);
    if (item?.assetUrl) acc[slot] = item.assetUrl;
    return acc;
  }, {});
  const loadoutSlots = Object.entries(loadout).map(([slot, itemId]) => ({
    slot,
    item: shopItems.find((entry) => entry.id === itemId)
  }));
  const checkingBalance =
    summary.balances.find((entry) => entry.account_type === "checking")
      ?.available_cents ?? 0;
  const savingsBalance =
    summary.balances.find((entry) => entry.account_type === "savings")
      ?.available_cents ?? 0;
  const activeMissions = summary.missions.filter((mission) => mission.status === "active");

  useEffect(() => {
    apiFetch("/api/finance/summary")
      .then((data) => setSummary(data))
      .catch((err) => setSummaryError(err.message));
  }, []);

  return (
    <div>
      <h1 className="page-title">{t("dashboard.title")}</h1>
      <p className="subtitle">
        {t("dashboard.welcome", { name: profile.displayName })}
      </p>

      <div className="grid grid-3">
        <Card title={t("dashboard.balance")} subtitle={t("dashboard.currentBalance")}>
          <strong>R$ {(checkingBalance / 100).toFixed(2)}</strong>
          <span className="tag">
            {t("dashboard.goldTag", { gold: gameState.gold })}
          </span>
        </Card>
        <Card title={t("dashboard.xpLevel")} subtitle={t("dashboard.adventureProgress")}>
          <strong>{t("dashboard.level", { level: gameState.level })}</strong>
          <ProgressBar value={Math.round((gameState.xp / 500) * 100)} label="XP" />
        </Card>
        <Card title={t("dashboard.streak")} subtitle={t("dashboard.dailyQuests")}>
          <strong>{t("dashboard.streakDays", { days: gameState.streakCount })}</strong>
          <ProgressBar value={healthScore} label={t("dashboard.financialHealth")} />
        </Card>
        <Card title={t("dashboard.savings")} subtitle={t("dashboard.savingsSubtitle")}>
          <strong>R$ {(savingsBalance / 100).toFixed(2)}</strong>
          <span className="tag">{t("dashboard.savingsTag")}</span>
        </Card>
      </div>

      <div className="grid grid-2" style={{ marginTop: "24px" }}>
        <Card
          title={t("dashboard.avatarLoadout")}
          subtitle={
            settings.discreteMode
              ? t("dashboard.discreteOn")
              : t("dashboard.forgeShimmer")
          }
          actions={
            <button className="button secondary" onClick={toggleDiscreteMode}>
              {t("dashboard.toggleDiscrete")}
            </button>
          }
        >
          <div className="avatar-loadout">
            <AvatarRenderer
              classKey={profile.classId}
              appearanceId={profile.appearanceId}
              equipped={equippedAssets}
              discreteMode={settings.discreteMode}
            />
            <p>
              {t("dashboard.class")}: <strong>{profile.classId}</strong>
            </p>
            <p>
              {t("dashboard.appearance")}: <strong>{profile.appearanceId}</strong>
            </p>
            {titleLabel && (
              <p>
                {t("dashboard.titleLabel")}: <strong>{titleLabel}</strong>
              </p>
            )}
            <div className="loadout-grid">
              {loadoutSlots.map(({ slot, item }) => (
                <div key={slot} className="loadout-slot">
                  <span className="tag">{slot}</span>
                  {item ? (
                    <div className="loadout-item">
                      <img src={item.assetUrl} alt={item.name} />
                      <span>{item.name}</span>
                    </div>
                  ) : (
                    <span className="subtitle">{t("dashboard.emptySlot")}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="badge">
              {t("dashboard.aura", { xp: gameState.xp })}
            </div>
          </div>
        </Card>

        <Card title={t("dashboard.counselor")} subtitle={t("dashboard.messageOfDay")}>
          <p>&quot;{t("dashboard.counselorTip")}&quot;</p>
        </Card>
      </div>

      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <Card title={t("dashboard.monthlyQuests")} subtitle={t("dashboard.budgetProgress")}>
          <div className="list">
            {monthBudgets.map((budget) => {
              const spend = transactions
                .filter(
                  (tx) =>
                    tx.category === budget.category &&
                    tx.occurredAt.slice(0, 7) === currentMonth
                )
                .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
              const percent = Math.min(
                120,
                Math.round((spend / budget.limitAmount) * 100)
              );
              return (
                <div key={budget.id} className="budget-progress">
                  <div className="budget-label">
                    <CategoryIcon category={budget.category} />
                    <span>{budget.category}</span>
                    <span className="tag">
                      R$ {spend} / {budget.limitAmount}
                    </span>
                  </div>
                  <ProgressBar
                    value={Number.isFinite(percent) ? percent : 0}
                    label={t("dashboard.questMeter")}
                  />
                </div>
              );
            })}
          </div>
        </Card>

        <Card title={t("dashboard.achievements")} subtitle={t("dashboard.latestBadges")}>
          <div className="list">
            {latestAchievements.length === 0 && (
              <span className="tag">{t("dashboard.firstBadge")}</span>
            )}
            {latestAchievements.map((achievement) => (
              <div key={achievement.code} className="achievement unlocked">
                <strong>{achievement.name}</strong>
                <span className="tag">{achievement.description}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card
        title={t("dashboard.savingsGoals")}
        subtitle={t("dashboard.savingsGoalsSubtitle")}
        style={{ marginTop: 24 }}
      >
        <div className="list">
          {activeMissions.length === 0 && (
            <span className="tag">{t("dashboard.noActiveMissions")}</span>
          )}
          {activeMissions.map((mission) => {
            const percent = mission.target_cents
              ? Math.min(
                  100,
                  Math.round((mission.saved_cents / mission.target_cents) * 100)
                )
              : 0;
            return (
              <div key={mission.id} className="budget-progress">
                <div className="budget-label">
                  <span>{mission.title}</span>
                  <span className="tag">
                    R$ {(mission.saved_cents / 100).toFixed(2)} /{" "}
                    {(mission.target_cents / 100).toFixed(2)}
                  </span>
                </div>
                <ProgressBar value={percent} label={t("dashboard.questMeter")} />
              </div>
            );
          })}
        </div>
        {summaryError && <div className="badge error">{summaryError}</div>}
      </Card>

      <Card
        title={t("dashboard.forgeAlerts")}
        subtitle={t("dashboard.alertSubtitle")}
        style={{ marginTop: 24 }}
      >
        <div className="list">
          {notifications.map((note) => (
            <div key={note.id} className={`tag alert ${note.type}`}>
              {note.message}
            </div>
          ))}
        </div>
      </Card>

      <Card
        title={t("dashboard.recentTransactions")}
        subtitle={t("dashboard.lastLogged")}
        style={{ marginTop: 24 }}
      >
        <div className="list">
          {recent.map((tx) => (
            <div key={tx.id} className="tag">
              <CategoryIcon category={tx.category} /> {tx.category} · R${" "}
              {Math.abs(tx.amount)} · {tx.note}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
