import { useState } from "react";
import Card from "../components/Card";
import { useGameStore } from "../store/useGameStore";

export default function Missions() {
  const { missions, addMission, completeMission } = useGameStore();
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("100");

  const handleCreate = () => {
    const success = addMission({
      id: `m-${Date.now()}`,
      title: title || "New Mission",
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

  return (
    <div>
      <h1 className="page-title">Missions</h1>
      <p className="subtitle">Create up to 3 active goals.</p>

      <div className="grid grid-2">
        <Card title="Create Mission" subtitle="Max 3 active">
          <input
            className="input"
            placeholder="Goal title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <input
            className="input"
            value={targetAmount}
            onChange={(event) => setTargetAmount(event.target.value)}
          />
          <button className="button" onClick={handleCreate}>
            Add Mission
          </button>
        </Card>

        <Card title="Active Missions" subtitle="Progress tracker">
          <div className="list">
            {missions.map((mission) => (
              <div key={mission.id} className="tag">
                <strong>{mission.title}</strong> · R$ {mission.currentAmount}/
                {mission.targetAmount}
                <div style={{ marginTop: 8 }}>
                  {mission.status === "active" ? (
                    <button
                      className="button secondary"
                      onClick={() => completeMission(mission.id)}
                    >
                      Complete
                    </button>
                  ) : (
                    <span className="badge">Completed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
