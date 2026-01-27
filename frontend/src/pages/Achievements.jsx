import Card from "../components/Card";
import { useGameStore } from "../store/useGameStore";

export default function Achievements() {
  const { achievements, userAchievements, profile, equipTitle } = useGameStore();
  const unlockedCodes = new Set(userAchievements.map((entry) => entry.code));
  const unlockedTitles = userAchievements.filter((entry) => entry.title);

  return (
    <div>
      <h1 className="page-title">Achievements</h1>
      <p className="subtitle">Badges earned on your journey through the forge.</p>

      <div className="grid grid-2">
        <Card title="Titles" subtitle="Equip a title for your banner">
          <label className="tag">Active Title</label>
          <select
            className="input"
            value={profile.titleCode || ""}
            onChange={(event) =>
              equipTitle(event.target.value === "" ? null : event.target.value)
            }
          >
            <option value="">None</option>
            {unlockedTitles.map((achievement) => (
              <option key={achievement.code} value={achievement.code}>
                {achievement.title}
              </option>
            ))}
          </select>
          <p className="subtitle">
            Titles are unlocked with achievements and shown on your Guild Hall card.
          </p>
        </Card>

        <Card title="Achievement Vault" subtitle="Track your guild honors">
          <div className="list">
            {achievements.map((achievement) => {
              const unlocked = unlockedCodes.has(achievement.code);
              return (
                <div
                  key={achievement.code}
                  className={unlocked ? "achievement unlocked" : "achievement"}
                >
                  <div>
                    <strong>{achievement.name}</strong>
                    <p>{achievement.description}</p>
                  </div>
                  <span className="badge">
                    {unlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
