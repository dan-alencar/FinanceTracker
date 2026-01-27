import Card from "../components/Card";
import { classes, appearances } from "../data/gameData";
import { useGameStore } from "../store/useGameStore";

export default function Onboarding() {
  const { profile } = useGameStore();

  return (
    <div>
      <h1 className="page-title">Primeira Expedição</h1>
      <p className="subtitle">
        Follow the onboarding path to forge your guild identity.
      </p>

      <div className="grid grid-2">
        <Card title="Step 1: Choose Class" subtitle="Three playable classes">
          {classes.map((entry) => (
            <div key={entry.id} className="tag">
              <strong>{entry.name}</strong> · {entry.description}
            </div>
          ))}
        </Card>

        <Card title="Step 2: Customize" subtitle="Five appearances">
          <div className="list">
            {appearances.map((entry) => (
              <span key={entry.id} className="tag">
                {entry.label}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-2" style={{ marginTop: "24px" }}>
        <Card title="Step 3: Starting Balance">
          <p>
            Set your initial balance. Suggested: R$ {profile.startingBalance}.
          </p>
          <input className="input" value={profile.startingBalance} readOnly />
        </Card>

        <Card title="Step 4: Guided Log" subtitle="Your first transaction">
          <p>Log your first expense to earn XP and gold.</p>
          <button className="button">Start Logging</button>
        </Card>
      </div>
    </div>
  );
}
