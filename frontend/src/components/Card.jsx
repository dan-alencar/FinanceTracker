import "../styles/card.css";

export default function Card({ title, subtitle, children, actions, ...rest }) {
  return (
    <section className="card" {...rest}>
      {(title || subtitle || actions) && (
        <header className="card-header">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}
