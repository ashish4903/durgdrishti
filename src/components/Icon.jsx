const paths = {
  mountain: <><path d="m3 20 7-14 4 8 2-4 5 10H3Z" /><path d="m8 10 2 2 2-1" /></>,
  timer: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2M9 2h6M12 2v3" /></>,
  road: <><path d="M5 22 9 2M19 22 15 2M12 6v3m0 4v3m0 4v1" /></>,
  leaf: <><path d="M20 4c-9 0-15 3-15 10a6 6 0 0 0 6 6c7 0 9-7 9-16Z" /><path d="M5 20c3-5 7-8 12-11" /></>,
  arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15m6-12v15" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>,
  bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
};

/** A decorative line icon; screen readers skip it, so the text beside it carries the meaning. */
export default function Icon({ name, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
