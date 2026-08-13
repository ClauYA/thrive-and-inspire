// Line-art icons for each cardio modality (stroke = currentColor, so they flip
// to white when the pill is selected). Keys match CARDIO_TYPES in lib/cardioTypes.
const ICONS = {
  Treadmill: (
    <>
      <ellipse cx="8" cy="8.5" rx="2.1" ry="3" />
      <circle cx="8" cy="13.8" r="1.2" />
      <ellipse cx="15" cy="12.5" rx="2.1" ry="3" />
      <circle cx="15" cy="17.8" r="1.2" />
    </>
  ),
  Bike: (
    <>
      <circle cx="6" cy="17" r="3.1" />
      <circle cx="18" cy="17" r="3.1" />
      <path d="M6 17l4-7h5" />
      <path d="M10 10l3.5 7" />
      <path d="M14.5 10H17l1 7" />
    </>
  ),
  Rowing: (
    <>
      <path d="M3 7c2-1.4 4-1.4 6 0s4 1.4 6 0 4-1.4 6 0" />
      <path d="M3 12c2-1.4 4-1.4 6 0s4 1.4 6 0 4-1.4 6 0" />
      <path d="M3 17c2-1.4 4-1.4 6 0s4 1.4 6 0 4-1.4 6 0" />
    </>
  ),
  Elliptical: (
    <>
      <ellipse cx="12" cy="12" rx="8" ry="4.6" transform="rotate(-20 12 12)" />
      <circle cx="7" cy="14.4" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  Stair: <path d="M4 19h4v-4h4v-4h4v-4h4" />,
  Walk: (
    <>
      <path d="M2 20h20" />
      <path d="M2 20 9 8l4 6 2-3 7 9" />
    </>
  ),
  HIIT: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />,
  JumpRope: (
    <>
      <path d="M6 5c-2 3.2-2 9.8 0 13" />
      <path d="M18 5c2 3.2 2 9.8 0 13" />
      <circle cx="12" cy="7" r="1.4" />
      <path d="M12 8.5v5" />
      <path d="M10 17l2-2 2 2" />
    </>
  ),
  Swim: (
    <>
      <path d="M3 18c2-1.4 4-1.4 6 0s4 1.4 6 0 4-1.4 6 0" />
      <circle cx="8" cy="9" r="1.4" />
      <path d="M9.4 9.8 14 12l3-2" />
    </>
  ),
  Other: (
    <>
      <path d="M2 12h2M20 12h2" />
      <path d="M5 9v6M8 8v8M16 8v8M19 9v6" />
      <path d="M8 12h8" />
    </>
  ),
};

export default function CardioIcon({ type, className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[type] || ICONS.Other}
    </svg>
  );
}
