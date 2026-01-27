import { useState } from "react";
import Card from "../components/Card";
import { useTranslation } from "react-i18next";

const mockUsers = [
  { id: "u-1", name: "Aria", lastActivity: "2024-05-14", streak: 3 },
  { id: "u-2", name: "Breno", lastActivity: "2024-05-13", streak: 1 }
];

export default function AdminCounselor() {
  const { t } = useTranslation();
  const [title, setTitle] = useState(() => t("admin.defaultTitle"));
  const [body, setBody] = useState(() => t("admin.defaultBody"));

  return (
    <div>
      <h1 className="page-title">{t("admin.title")}</h1>
      <p className="subtitle">{t("admin.subtitle")}</p>

      <div className="grid grid-2">
        <Card title={t("admin.users")} subtitle={t("admin.recentActivity")}>
          <div className="list">
            {mockUsers.map((user) => (
              <div key={user.id} className="tag">
                {user.name} · {t("admin.last")}: {user.lastActivity} · {t("admin.streak")} {user.streak}
              </div>
            ))}
          </div>
        </Card>

        <Card title={t("admin.sendMessage")}>
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
          <button className="button">{t("admin.sendGuild")}</button>
        </Card>
      </div>
    </div>
  );
}
