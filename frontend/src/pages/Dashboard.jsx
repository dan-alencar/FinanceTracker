import Card from "../components/Card";
import ProgressBar from "../components/ProgressBar";
import { useGameStore } from "../store/useGameStore";

export default function Dashboard() {
  const { profile, gameState, transactions, settings, toggleDiscreteMode } =
    useGameStore();
  const recent = transactions.slice(0, 3);
  const healthScore = Math.min(100, Math.round(gameState.streakCount * 12 + 40));

  return (
    <div>
      <h1 className="page-title">Guild Hall Dashboard</h1>
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
          title="Animated Avatar"
          subtitle={settings.discreteMode ? "Discrete mode on" : "Arcane shimmer"}
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

      <Card title="Recent Transactions" subtitle="Last logged expenses" style={{ marginTop: 24 }}>
        <div className="list">
          {recent.map((tx) => (
            <div key={tx.id} className="tag">
              {tx.category} · R$ {Math.abs(tx.amount)} · {tx.note}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
