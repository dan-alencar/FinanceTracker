import Card from "../components/Card";
import { useGameStore } from "../store/useGameStore";

export default function Inbox() {
  const { counselorMessages, markMessageRead } = useGameStore();

  return (
    <div>
      <h1 className="page-title">Raven Post</h1>
      <p className="subtitle">Messages sent by the Wizard-of-Oz counselor.</p>

      <div className="grid grid-2">
        {counselorMessages.map((message) => (
          <Card key={message.id} title={message.title} subtitle={message.sentAt}>
            <p>{message.body}</p>
            <button className="button secondary" onClick={() => markMessageRead(message.id)}>
              {message.readAt ? "Read" : "Mark as Read"}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
