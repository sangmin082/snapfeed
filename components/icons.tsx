// Duotone icon set — 24×24. A soft base shape at ~32% opacity carries the
// silhouette; a solid foreground detail gives it weight. One visual language
// across tab bar, cards and settings rows (Phosphor-duotone lineage — reads
// far more "designed" than empty 1.8px outlines).

type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      {children}
    </svg>
  );
}

export function HomeIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path
        opacity=".32"
        d="M4.5 10.2 11 4.6a1.6 1.6 0 0 1 2 0l6.5 5.6c.3.3.5.7.5 1.1V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7.7c0-.4.2-.8.5-1.1Z"
      />
      <path d="M10 21v-5.2c0-.7.6-1.3 1.3-1.3h1.4c.7 0 1.3.6 1.3 1.3V21h-4Z" />
    </Svg>
  );
}

export function ListIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect opacity=".32" x="3" y="4" width="18" height="16" rx="3" />
      <rect x="7" y="8" width="10" height="2" rx="1" />
      <rect x="7" y="12" width="10" height="2" rx="1" />
      <rect x="7" y="16" width="6" height="2" rx="1" />
    </Svg>
  );
}

export function CameraIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path
        opacity=".32"
        d="M8.2 4.9c.3-.6.9-.9 1.5-.9h4.6c.6 0 1.2.3 1.5.9l.8 1.6h2.9A2.5 2.5 0 0 1 22 9v9a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18V9a2.5 2.5 0 0 1 2.5-2.5h2.9l.8-1.6Z"
      />
      <path d="M12 9.3a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4Zm0 2.1a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2Z" />
    </Svg>
  );
}

export function PictureIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect opacity=".32" x="2.5" y="4.5" width="19" height="15" rx="3" />
      <circle cx="8.5" cy="9.7" r="1.7" />
      <path d="M21.5 14.6 17.8 11a1.5 1.5 0 0 0-2.1 0l-7.4 7.4c-.4.4-.1 1.1.5 1.1h9.7a3 3 0 0 0 3-3v-1.9Z" />
    </Svg>
  );
}

export function ChartIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect opacity=".32" x="3.5" y="11" width="4.4" height="9.5" rx="1.6" />
      <rect x="9.8" y="3.5" width="4.4" height="17" rx="1.6" />
      <rect opacity=".32" x="16.1" y="7.5" width="4.4" height="13" rx="1.6" />
    </Svg>
  );
}

export function BellIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path
        opacity=".32"
        d="M12 2.8c-3.5 0-5.9 2.6-5.9 6.2 0 3.4-1 4.6-1.7 5.3-.5.5-.2 1.7.8 1.7h13.6c1 0 1.3-1.2.8-1.7-.7-.7-1.7-1.9-1.7-5.3 0-3.6-2.4-6.2-5.9-6.2Z"
      />
      <path d="M9.6 18.8a2.5 2.5 0 0 0 4.8 0H9.6Z" />
    </Svg>
  );
}

export function UsersIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path
        opacity=".32"
        d="M16.5 6.2a3.4 3.4 0 0 1 0 6.4M18.3 14.9c1.6.7 2.8 2 3.4 3.8.2.7-.3 1.3-1 1.3h-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="9.5" cy="8.5" r="3.7" />
      <path d="M9.5 14c-3.3 0-5.8 1.8-6.6 4.7-.2.7.4 1.3 1.1 1.3h11c.7 0 1.3-.6 1.1-1.3-.8-2.9-3.3-4.7-6.6-4.7Z" />
    </Svg>
  );
}

export function MailIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect opacity=".32" x="2.5" y="5" width="19" height="14.5" rx="3" />
      <path d="M3.2 6.4a1 1 0 0 1 1.3-.2l6.9 4.8c.4.2.8.2 1.2 0l6.9-4.8a1 1 0 0 1 1.3.2c.3.4.2 1-.2 1.3l-7.4 5.2a2.2 2.2 0 0 1-2.4 0L3.4 7.7a1 1 0 0 1-.2-1.3Z" />
    </Svg>
  );
}

export function MoonIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path
        opacity=".32"
        d="M20.6 14.6A8.8 8.8 0 0 1 9.4 3.4 8.8 8.8 0 1 0 20.6 14.6Z"
      />
      <path d="M20.6 14.6A8.8 8.8 0 0 1 12 20.5c2-1.7 3.3-4.6 3.3-8s-1.2-6.3-3.3-8a8.8 8.8 0 0 1 8.6 10.1Z" />
    </Svg>
  );
}

export function BabyIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle opacity=".32" cx="12" cy="13" r="8" />
      <path d="M12 5c-.2-1.6.7-3 2.3-3.3.3 0 .6.2.6.5 0 1.4-1.1 2.6-2.9 2.8Z" />
      <circle cx="9.3" cy="12.3" r="1" />
      <circle cx="14.7" cy="12.3" r="1" />
      <path
        d="M9.7 15.6c.7.8 1.5 1.1 2.3 1.1.8 0 1.6-.3 2.3-1.1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

export function BottleIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path
        opacity=".32"
        d="M8.5 9.5A3.5 3.5 0 0 1 12 6a3.5 3.5 0 0 1 3.5 3.5V19a2.5 2.5 0 0 1-2.5 2.5h-2A2.5 2.5 0 0 1 8.5 19V9.5Z"
      />
      <path d="M10.6 2.4c.1-.5.6-.9 1.4-.9s1.3.4 1.4.9c.1.6.2 1.4 0 2.1-.3.9-2.5.9-2.8 0-.2-.7-.1-1.5 0-2.1Z" />
      <rect x="8.5" y="12.2" width="7" height="2" rx="1" />
    </Svg>
  );
}

export function PrinterIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect opacity=".32" x="3" y="8" width="18" height="9" rx="2.5" />
      <path d="M7 3h10a1 1 0 0 1 1 1v4H6V4a1 1 0 0 1 1-1Z" opacity=".32" />
      <path d="M7 13.5h10a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-5.5a1 1 0 0 1 1-1Z" />
    </Svg>
  );
}

export function CheckCircleIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle opacity=".32" cx="12" cy="12" r="10" />
      <path
        d="m7.8 12.4 2.9 2.9 5.5-6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function PencilIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4.5 19.5 5.4 16 16.2 5.2a2.4 2.4 0 0 1 3.4 3.4L8.8 19.4l-3.5.9a.7.7 0 0 1-.8-.8Z" />
    </Svg>
  );
}

export function GearIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path
        opacity=".32"
        d="M10.6 2.6c.8-.5 1.9-.5 2.8 0l.3.2c.4.3 1 .4 1.5.3l.4-.1c1-.2 2 .3 2.4 1.2l.2.3c.2.5.7.9 1.2 1l.4.1c1 .3 1.6 1.1 1.6 2.1v.4c0 .5.2 1 .6 1.4l.3.3c.7.7.9 1.8.4 2.7l-.2.3c-.3.5-.3 1 0 1.5l.2.3c.5.9.3 2-.4 2.7l-.3.3c-.4.4-.6.9-.6 1.4v.4c0 1-.7 1.9-1.6 2.1l-.4.1c-.5.1-1 .5-1.2 1l-.2.3c-.4.9-1.4 1.4-2.4 1.2l-.4-.1c-.5-.1-1.1 0-1.5.3l-.3.2c-.9.5-2 .5-2.8 0l-.3-.2c-.4-.3-1-.4-1.5-.3l-.4.1c-1 .2-2-.3-2.4-1.2l-.2-.3c-.2-.5-.7-.9-1.2-1l-.4-.1c-1-.3-1.6-1.1-1.6-2.1v-.4c0-.5-.2-1-.6-1.4l-.3-.3a2.3 2.3 0 0 1-.4-2.7l.2-.3c.3-.5.3-1 0-1.5l-.2-.3c-.5-.9-.3-2 .4-2.7l.3-.3c.4-.4.6-.9.6-1.4v-.4c0-1 .7-1.9 1.6-2.1l.4-.1c.5-.1 1-.5 1.2-1l.2-.3c.4-.9 1.4-1.4 2.4-1.2l.4.1c.5.1 1.1 0 1.5-.3l.3-.2Z"
      />
      <circle cx="12" cy="12" r="3.4" />
    </Svg>
  );
}
