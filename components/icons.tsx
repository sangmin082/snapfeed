// Shared line-icon set — 24×24, stroke 1.8, round caps/joins.
// Matches the BottomTabBar icons so every surface uses one visual language
// (replaces the emoji-as-icon usage that read as "AI-generated").

type IconProps = { className?: string };

function base(props: IconProps) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: props.className,
    "aria-hidden": true,
  };
}

export function CameraIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 8h2.5l1.5-2.5h8L17.5 8H20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </svg>
  );
}

export function PictureIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="m21 15-4.5-4.5L9 18" />
    </svg>
  );
}

export function ListIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ChartIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 20V10M10 20V4M16 20v-8M21 20H3" />
    </svg>
  );
}

export function BellIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
      <path d="M10.3 19a2 2 0 0 0 3.4 0" />
    </svg>
  );
}

export function UsersIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M3.5 19.5c1.2-2.8 3.2-4 5.5-4s4.3 1.2 5.5 4" />
      <path d="M16 5.6a3.5 3.5 0 0 1 0 5.8M18.6 15.9c1 .7 1.8 1.9 2.4 3.6" />
    </svg>
  );
}

export function MailIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  );
}

export function MoonIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
    </svg>
  );
}

export function BabyIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="13" r="7" />
      <path d="M12 6c0-1.7 1-3 2.5-3" />
      <circle cx="9.5" cy="12.5" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12.5" r="0.5" fill="currentColor" stroke="none" />
      <path d="M10 15.5c.6.7 1.3 1 2 1s1.4-.3 2-1" />
    </svg>
  );
}

export function BottleIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M10 2.5h4M11 2.5v2M13 2.5v2" />
      <path d="M9.5 7.5c0-1.7 1.1-3 2.5-3s2.5 1.3 2.5 3" />
      <rect x="8.5" y="7.5" width="7" height="14" rx="2.5" />
      <path d="M8.5 13h7" />
    </svg>
  );
}

export function PrinterIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M7 8V3h10v5" />
      <rect x="4" y="8" width="16" height="8" rx="1.5" />
      <path d="M7 13h10v8H7z" />
    </svg>
  );
}

export function CheckCircleIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 5-5.5" />
    </svg>
  );
}

export function PencilIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1Z" />
    </svg>
  );
}
