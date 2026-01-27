import "../styles/progress.css";

export default function ProgressBar({ value, label }) {
  return (
    <div className="progress">
      <div className="progress-label">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-bar" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
