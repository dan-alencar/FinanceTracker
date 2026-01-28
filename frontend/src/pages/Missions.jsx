import { useEffect, useState } from "react";
import Card from "../components/Card";
import { useGameStore } from "../store/useGameStore";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/apiClient";

export default function Missions() {
  const { t } = useTranslation();
  const { settings } = useGameStore();
  const [missions, setMissions] = useState([]);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("100");
  const [contribution, setContribution] = useState("25");
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState("");

  const fetchMissions = async () => {
    const data = await apiFetch("/missions");
    setMissions(data.missions || []);
  };

  useEffect(() => {
    fetchMissions().catch((err) => setError(err.message));
  }, []);

  const handleCreate = async () => {
    setError("");
    const targetCents = Math.round(Number(targetAmount) * 100);
    if (!targetCents || targetCents <= 0) {
      setError(t("missions.invalidTarget"));
      return;
    }
    await apiFetch("/missions", {
      method: "POST",
      body: JSON.stringify({
        title: title || t("missions.newMission"),
        targetCents
      })
    });
    setTitle("");
    await fetchMissions();
  };

  const handleComplete = async (missionId) => {
    setError("");
    await apiFetch(`/missions/${missionId}/complete`, { method: "POST" });
    await fetchMissions();
    if (!settings.discreteMode) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 900);
    }
  };

  const handleDeposit = async (missionId) => {
    setError("");
    const amountCents = Math.round(Number(contribution) * 100);
    if (!amountCents || amountCents <= 0) {
      setError(t("missions.invalidContribution"));
      return;
    }
    await apiFetch("/api/finance/savings/deposit", {
      method: "POST",
      body: JSON.stringify({
        amountCents,
        missionId,
        clientGeneratedId: crypto.randomUUID()
      })
    });
    await fetchMissions();
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
          {error && <div className="badge error">{error}</div>}
        </Card>

        <Card title={t("missions.active")} subtitle={t("missions.progress")}>
          <div className="list">
            {missions.map((mission) => (
              <div key={mission.id} className="tag">
                <strong>{mission.title}</strong> · R$ {(mission.saved_cents / 100).toFixed(2)}/
                {(mission.target_cents / 100).toFixed(2)}
                <div style={{ marginTop: 8 }}>
                  {mission.status === "active" ? (
                    <div className="list">
                      <label className="tag">{t("missions.contribution")}</label>
                      <input
                        className="input"
                        value={contribution}
                        onChange={(event) => setContribution(event.target.value)}
                      />
                      <div className="toggle-group">
                        <button
                          className="button secondary"
                          onClick={() => handleDeposit(mission.id)}
                        >
                          {t("missions.deposit")}
                        </button>
                        <button
                          className="button secondary"
                          onClick={() => handleComplete(mission.id)}
                        >
                          {t("missions.complete")}
                        </button>
                      </div>
                    </div>
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
