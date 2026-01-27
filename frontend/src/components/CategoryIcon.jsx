const iconMap = {
  Food: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3h2v7a2 2 0 0 1-4 0V3h2v7a1 1 0 0 0 2 0V3zM14 3h2v7h2V3h2v9a3 3 0 0 1-3 3h-1v6h-2v-6h-1a3 3 0 0 1-3-3V3h2v7h2V3z"
        fill="currentColor"
      />
    </svg>
  ),
  Transport: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-8z"
        fill="currentColor"
      />
    </svg>
  ),
  Entertainment: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm2 4h2v2H9V8zm4 0h2v2h-2V8zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2z"
        fill="currentColor"
      />
    </svg>
  ),
  Education: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3l10 5-10 5L2 8l10-5zm-7 8.5l7 3.5 7-3.5V16l-7 3.5L5 16v-4.5z"
        fill="currentColor"
      />
    </svg>
  ),
  Health: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s-6-4.35-8.5-7.5C1.5 10.5 3 7 6.5 7c2 0 3.5 1.2 4.5 2.5C12 8.2 13.5 7 15.5 7 19 7 20.5 10.5 18.5 13.5 16 16.65 12 21 12 21z"
        fill="currentColor"
      />
    </svg>
  ),
  Other: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 6h16v4H4V6zm0 6h16v4H4v-4zm0 6h10v2H4v-2z"
        fill="currentColor"
      />
    </svg>
  )
};

export default function CategoryIcon({ category }) {
  const icon = iconMap[category] || null;
  return <span className="category-icon">{icon}</span>;
}
