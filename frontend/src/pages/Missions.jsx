import { useState } from "react";
import Card from "../components/Card";
import { useGameStore } from "../store/useGameStore";
import { useTranslation } from "react-i18next";

export default function Missions() {
  const { t } = useTranslation();
  const { missions, addMission, completeMission, settings } = useGameStore();
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("100");
  const [showToast, setShowToast] = useState(false);

  const handleCreate = () => {
    const success = addMission({
      id: `m-${Date.now()}`,
      title: title || t("missions.newMission"),
      targetAmount: Number(targetAmount) || 0,
      currentAmount: 0,
      status: "active",
      rewardXp: 200,
      rewardGold: 90
    });
    if (success) {
      setTitle("");
    }
  };

  const handleComplete = (missionId) => {
    completeMission(missionId);
    if (!settings.discreteMode) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 900);
    }
  };

  return (
    <div>
      <h1 className="page-title">{t("missions.title")}</h1>
      <p className="subtitle">{t("missions.subtitle")}</p>

      <div className="grid grid-2">
        <Card title={t("missions.create")} subtitle={t("missions.maxActive")}>
          <input
            className="input"
            placeholder={t("missions.goalTitle")}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <input
            className="input"
            value={targetAmount}
            onChange={(event) => setTargetAmount(event.target.value)}
          />
          <button className="button" onClick={handleCreate}>
            {t("missions.add")}
          </button>
        </Card>

        <Card title={t("missions.active")} subtitle={t("missions.progress")}>
          <div className="list">
            {missions.map((mission) => (
              <div key={mission.id} className="tag">
                <strong>{mission.title}</strong> · R$ {mission.currentAmount}/
                {mission.targetAmount}
                <div style={{ marginTop: 8 }}>
                  {mission.status === "active" ? (
                    <button
                      className="button secondary"
                      onClick={() => handleComplete(mission.id)}
                    >
                      {t("missions.complete")}
                    </button>
                  ) : (
                    <span className="badge">{t("missions.completed")}</span>
                  )}
                </div>
              </div>
            ))}
            {showToast && !settings.discreteMode && (
              <div className="toast">{t("missions.toast")}</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
