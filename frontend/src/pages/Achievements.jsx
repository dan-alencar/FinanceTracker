import Card from "../components/Card";
import { useGameStore } from "../store/useGameStore";
import { useTranslation } from "react-i18next";

export default function Achievements() {
  const { t } = useTranslation();
  const { achievements, userAchievements, profile, equipTitle } = useGameStore();
  const unlockedCodes = new Set(userAchievements.map((entry) => entry.code));
  const unlockedTitles = userAchievements.filter((entry) => entry.title);

  return (
    <div>
      <h1 className="page-title">{t("achievements.title")}</h1>
      <p className="subtitle">{t("achievements.subtitle")}</p>

      <div className="grid grid-2">
        <Card title={t("achievements.titles")} subtitle={t("achievements.equipTitle")}>
          <label className="tag">{t("achievements.activeTitle")}</label>
          <select
            className="input"
            value={profile.titleCode || ""}
            onChange={(event) =>
              equipTitle(event.target.value === "" ? null : event.target.value)
            }
          >
            <option value="">{t("achievements.none")}</option>
            {unlockedTitles.map((achievement) => (
              <option key={achievement.code} value={achievement.code}>
                {achievement.title}
              </option>
            ))}
          </select>
          <p className="subtitle">
            {t("achievements.titlesHint")}
          </p>
        </Card>

        <Card title={t("achievements.vault")} subtitle={t("achievements.track")}>
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
                    {unlocked ? t("achievements.unlocked") : t("achievements.locked")}
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
