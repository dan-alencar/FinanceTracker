import Card from "../components/Card";
import { useGameStore } from "../store/useGameStore";
import { useTranslation } from "react-i18next";

export default function Inbox() {
  const { t } = useTranslation();
  const { counselorMessages, markMessageRead } = useGameStore();

  return (
    <div>
      <h1 className="page-title">{t("inbox.title")}</h1>
      <p className="subtitle">{t("inbox.subtitle")}</p>

      <div className="grid grid-2">
        {counselorMessages.map((message) => (
          <Card key={message.id} title={message.title} subtitle={message.sentAt}>
            <p>{message.body}</p>
            <button className="button secondary" onClick={() => markMessageRead(message.id)}>
              {message.readAt ? t("inbox.read") : t("inbox.markRead")}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
