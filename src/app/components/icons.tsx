// Small stroke icons, 16px grid, inheriting currentColor. Decorative: hidden from assistive tech.
type IconProps = { className?: string };

function Icon({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className ?? "size-4"}
    >
      {children}
    </svg>
  );
}

export const ArrowUp = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
  </Icon>
);

export const ArrowRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 8h10M8.5 3.5 13 8l-4.5 4.5" />
  </Icon>
);

export const ArrowUpRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 11 11 5M5.5 5H11v5.5" />
  </Icon>
);

export const Check = (p: IconProps) => (
  <Icon {...p}>
    <path d="m3.5 8.5 3 3 6-7" />
  </Icon>
);

export const Alert = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="6.25" />
    <path d="M8 4.75v3.75M8 11.1v.15" />
  </Icon>
);

export const Retry = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13 8a5 5 0 1 1-1.5-3.55M13 2.75V5h-2.25" />
  </Icon>
);

export const Compose = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7.5 2.75H4.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h7.5a1.5 1.5 0 0 0 1.5-1.5V8.5" />
    <path d="m11.75 2.25 2 2-5.5 5.5-2.5.5.5-2.5 5.5-5.5Z" />
  </Icon>
);

export const Sun = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="2.75" />
    <path d="M8 1.75v1M8 13.25v1M1.75 8h1M13.25 8h1M3.6 3.6l.7.7M11.7 11.7l.7.7M3.6 12.4l.7-.7M11.7 4.3l.7-.7" />
  </Icon>
);

export const Moon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13.25 9.6A5.5 5.5 0 0 1 6.4 2.75a5.5 5.5 0 1 0 6.85 6.85Z" />
  </Icon>
);

export const Monitor = (p: IconProps) => (
  <Icon {...p}>
    <rect x="1.75" y="2.75" width="12.5" height="8.5" rx="1.5" />
    <path d="M5.5 14h5M8 11.25V14" />
  </Icon>
);

export const PanelRight = (p: IconProps) => (
  <Icon {...p}>
    <rect x="1.75" y="2.25" width="12.5" height="11.5" rx="1.5" />
    <path d="M10 2.25v11.5" />
  </Icon>
);

export const Close = (p: IconProps) => (
  <Icon {...p}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </Icon>
);
