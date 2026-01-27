import Card from "../components/Card";
import ProgressBar from "../components/ProgressBar";
import CategoryIcon from "../components/CategoryIcon";
import { getCurrentMonth } from "../lib/dateUtils";
import { useGameStore } from "../store/useGameStore";

export default function Dashboard() {
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
    notifications
  } = useGameStore();
  const recent = transactions.slice(0, 3);
  const healthScore = Math.min(100, Math.round(gameState.streakCount * 12 + 40));
  const currentMonth = getCurrentMonth(settings.timezone);
  const monthBudgets = budgets.filter((budget) => budget.month === currentMonth);
  const titleLabel =
    achievements.find((entry) => entry.code === profile.titleCode)?.title || null;
  const latestAchievements = userAchievements.slice(0, 3);

  return (
    <div>
      <h1 className="page-title">Guild Hall</h1>
      <p className="subtitle">
        Bem-vindo, {profile.displayName}. Keep your coin trail glowing.
      </p>

      <div className="grid grid-3">
        <Card title="Balance" subtitle="Current gold balance">
          <strong>R$ {profile.startingBalance + gameState.gold}</strong>
          <span className="tag">Gold: {gameState.gold}</span>
        </Card>
        <Card title="XP & Level" subtitle="Adventure progress">
          <strong>Level {gameState.level}</strong>
          <ProgressBar value={Math.round((gameState.xp / 500) * 100)} label="XP" />
        </Card>
        <Card title="Streak" subtitle="Daily quests">
          <strong>{gameState.streakCount} days</strong>
          <ProgressBar value={healthScore} label="Financial Health" />
        </Card>
      </div>

      <div className="grid grid-2" style={{ marginTop: "24px" }}>
        <Card
          title="Avatar Loadout"
          subtitle={settings.discreteMode ? "Discrete mode on" : "Forge shimmer"}
          actions={
            <button className="button secondary" onClick={toggleDiscreteMode}>
              Toggle Discrete
            </button>
          }
        >
          <div>
            <p>
              Class: <strong>{profile.classId}</strong>
            </p>
            <p>
              Appearance: <strong>{profile.appearanceId}</strong>
            </p>
            {titleLabel && (
              <p>
                Title: <strong>{titleLabel}</strong>
              </p>
            )}
            <div className="loadout-grid">
              {Object.entries(loadout).map(([slot, itemId]) => (
                <span key={slot} className="tag">
                  {slot}: {itemId || "Empty"}
                </span>
              ))}
            </div>
            <div className="badge">Aura: +{gameState.xp} XP</div>
          </div>
        </Card>

        <Card title="Guild Counselor" subtitle="Message of the day">
          <p>
            "Spend with intention, hero. Track today and the forge will reward
            you with XP."
          </p>
        </Card>
      </div>

      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <Card title="Monthly Quests" subtitle="Budget quests in progress">
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
                  <ProgressBar value={Number.isFinite(percent) ? percent : 0} label="Quest Meter" />
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Achievements" subtitle="Latest badges">
          <div className="list">
            {latestAchievements.length === 0 && (
              <span className="tag">Log a transaction to earn your first badge.</span>
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
        title="Forge Alerts"
        subtitle="Budget warnings and counselor tips"
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

      <Card title="Recent Transactions" subtitle="Last logged expenses" style={{ marginTop: 24 }}>
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
