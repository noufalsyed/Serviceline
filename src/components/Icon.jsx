const PATHS = {
  dashboard: 'M4 13h6V4H4zM14 20h6V4h-6zM4 20h6v-4H4z',
  equipment: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9',
  bell: 'M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6zM10 20a2 2 0 004 0',
  building: 'M4 21V5l8-2v18M12 21V9l7 2v10M3 21h18M8 8h1M8 12h1M8 16h1M15 13h1M15 17h1',
  chart: 'M4 20V4M4 20h16M8 16v-5M13 16V8M18 16v-9',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  qr: 'M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M4 12h16',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.3-4.3',
  logout: 'M15 12H3M11 8l-4 4 4 4M9 5V4a2 2 0 012-2h6a2 2 0 012 2v16a2 2 0 01-2 2h-6a2 2 0 01-2-2v-1',
  chevron: 'M9 6l6 6-6 6',
  back: 'M15 18l-6-6 6-6',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M4 12l5 5L20 6',
  plus: 'M12 5v14M5 12h14',
  sun: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19',
  moon: 'M20 14a8 8 0 01-10-10 8 8 0 1010 10z',
  download: 'M12 3v12M8 11l4 4 4-4M4 21h16',
  camera: 'M4 8a2 2 0 012-2h1l1.5-2h7L18 6h1a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2zM12 9.3a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4z',
  pin: 'M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11zM12 7.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z',
  file: 'M6 2h8l4 4v16H6zM14 2v4h4',
  clock: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2',
  send: 'M4 4l16 8-16 8 3-8z',
  user: 'M12 4a4 4 0 100 8 4 4 0 000-8zM4 21c0-4 4-6 8-6s8 2 8 6',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
  printer: 'M7 8V3h10v5M7 18H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2M7 14h10v7H7z',
  refresh: 'M20 12a8 8 0 11-2.3-5.7M20 4v4h-4',
  alert: 'M12 3L2 20h20L12 3zM12 10v4M12 17h.01',
  wrench: 'M14.5 6.5a4 4 0 01-5.2 5.2L4 17v3h3l5.3-5.3a4 4 0 015.2-5.2l-2.6 2.6-2.1-2.1z',
  trash: 'M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6.5 7l.9 13a1 1 0 001 .9h7.2a1 1 0 001-.9l.9-13M10 11.5v5M14 11.5v5',
  edit: 'M4 20h4L18.5 9.5a2.83 2.83 0 10-4-4L4 16zM13.5 6.5l4 4',
  key: 'M15.5 3a5.5 5.5 0 00-5.2 7.3L3 17.6V21h3.4v-2h2v-2h2l1.3-1.3A5.5 5.5 0 1015.5 3zM17 7.5h.01',
  ban: 'M12 3a9 9 0 100 18 9 9 0 000-18zM5.6 5.6l12.8 12.8',
  database: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  upload: 'M12 21V9M8 13l4-4 4 4M4 3h16'
}

export default function Icon({ name, size, className, ...rest }) {
  const d = PATHS[name]
  if (!d) return null
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={d} />
    </svg>
  )
}
