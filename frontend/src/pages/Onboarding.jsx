import { useState } from "react";
import Card from "../components/Card";
import { classes, appearances } from "../data/gameData";
import { useGameStore } from "../store/useGameStore";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/apiClient";

export default function Onboarding() {
  const { t } = useTranslation();
  const { profile } = useGameStore();
  const [startingBalance, setStartingBalance] = useState(
    String(profile.startingBalance ?? 0)
  );
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleInitialize = async () => {
    setError("");
    setStatus("");
    const balanceCents = Math.round(Number(startingBalance) * 100);
    if (Number.isNaN(balanceCents) || balanceCents < 0) {
      setError(t("onboarding.invalidBalance"));
      return;
    }
    try {
      await apiFetch("/avatar", {
        method: "POST",
        body: JSON.stringify({
          classId: profile.classId,
          appearanceId: profile.appearanceId,
          startingBalanceCents: balanceCents
        })
      });
      await apiFetch("/api/finance/initialize", {
        method: "POST",
        body: JSON.stringify({ initialBalanceCents: balanceCents })
      });
      setStatus(t("onboarding.initialized"));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="page-title">{t("onboarding.title")}</h1>
      <p className="subtitle">{t("onboarding.subtitle")}</p>

      <div className="grid grid-2">
        <Card title={t("onboarding.step1Title")} subtitle={t("onboarding.step1Subtitle")}>
          {classes.map((entry) => (
            <div key={entry.id} className="tag">
              <strong>{entry.name}</strong> · {entry.description}
            </div>
          ))}
        </Card>

        <Card title={t("onboarding.step2Title")} subtitle={t("onboarding.step2Subtitle")}>
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
        <Card title={t("onboarding.step3Title")}>
          <p>
            {t("onboarding.step3Body", { balance: profile.startingBalance })}
          </p>
          <input
            className="input"
            value={startingBalance}
            onChange={(event) => setStartingBalance(event.target.value)}
          />
          <button className="button" onClick={handleInitialize}>
            {t("onboarding.step3Button")}
          </button>
          {status && <div className="badge success">{status}</div>}
          {error && <div className="badge error">{error}</div>}
        </Card>

        <Card title={t("onboarding.step4Title")} subtitle={t("onboarding.step4Subtitle")}>
          <p>{t("onboarding.step4Body")}</p>
          <button className="button">{t("onboarding.step4Button")}</button>
        </Card>
      </div>
    </div>
  );
}
