import { useState } from "react";
import Card from "../components/Card";

const mockUsers = [
  { id: "u-1", name: "Aria", lastActivity: "2024-05-14", streak: 3 },
  { id: "u-2", name: "Breno", lastActivity: "2024-05-13", streak: 1 }
];

export default function AdminCounselor() {
  const [title, setTitle] = useState("Guild Tip");
  const [body, setBody] = useState("Log your next expense to keep the streak alive.");

  return (
    <div>
      <h1 className="page-title">War Room Console</h1>
      <p className="subtitle">Wizard-of-Oz message console for admins.</p>

      <div className="grid grid-2">
        <Card title="Users" subtitle="Recent activity">
          <div className="list">
            {mockUsers.map((user) => (
              <div key={user.id} className="tag">
                {user.name} · Last: {user.lastActivity} · Streak {user.streak}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Send Message">
          <input
            className="input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <textarea
            className="input"
            rows={4}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <button className="button">Send to Guild</button>
        </Card>
      </div>
    </div>
  );
}
