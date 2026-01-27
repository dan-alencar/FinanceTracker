import "../styles/progress.css";

export default function ProgressBar({ value, label }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="progress">
      <div className="progress-label">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-bar" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
