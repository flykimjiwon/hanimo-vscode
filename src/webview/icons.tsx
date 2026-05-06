// Inline SVGs — minimal, currentColor for theming. Reused via name prop.
import { JSX } from 'preact';

type Props = JSX.HTMLAttributes<SVGSVGElement> & { size?: number };

const wrap = (size: number) => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
});

export const PlusIcon = ({ size = 14, ...p }: Props) =>
  <svg {...wrap(size)} {...p}><path d="M12 5v14M5 12h14" /></svg>;
export const ChevronDown = ({ size = 12, ...p }: Props) =>
  <svg {...wrap(size)} {...p}><path d="M6 9l6 6 6-6" /></svg>;
export const ChevronRight = ({ size = 12, ...p }: Props) =>
  <svg {...wrap(size)} {...p}><path d="M9 6l6 6-6 6" /></svg>;
export const Gear = ({ size = 14, ...p }: Props) =>
  <svg {...wrap(size)} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>;
export const Dots = ({ size = 14, ...p }: Props) =>
  <svg {...wrap(size)} {...p}><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></svg>;
export const Expand = ({ size = 14, ...p }: Props) =>
  <svg {...wrap(size)} {...p}><path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" /></svg>;
export const Close = ({ size = 14, ...p }: Props) =>
  <svg {...wrap(size)} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const Send = ({ size = 14, ...p }: Props) =>
  <svg {...wrap(size)} {...p}><path d="M12 19V5M5 12l7-7 7 7" /></svg>;
export const Stop = ({ size = 12, ...p }: Props) =>
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>;
export const Code = ({ size = 14, ...p }: Props) =>
  <svg {...wrap(size)} {...p}><path d="M16 18l6-6-6-6M8 6l-6 6 6 6" /></svg>;
export const Sliders = ({ size = 14, ...p }: Props) =>
  <svg {...wrap(size)} {...p}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></svg>;
export const Monitor = ({ size = 12, ...p }: Props) =>
  <svg {...wrap(size)} {...p}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>;
export const Shield = ({ size = 12, ...p }: Props) =>
  <svg {...wrap(size)} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
export const Trash = ({ size = 12, ...p }: Props) =>
  <svg {...wrap(size)} {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>;
export const Refresh = ({ size = 12, ...p }: Props) =>
  <svg {...wrap(size)} {...p}><path d="M3 12a9 9 0 0 1 15.5-6.5L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.5L3 16M3 21v-5h5" /></svg>;
export const Book = ({ size = 14, ...p }: Props) =>
  <svg {...wrap(size)} {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
export const History = ({ size = 14, ...p }: Props) =>
  <svg {...wrap(size)} {...p}><path d="M3 12a9 9 0 1 0 9-9 9.7 9.7 0 0 0-7 3l-2 2M3 4v4h4M12 7v5l3 2" /></svg>;
export const Check = ({ size = 12, ...p }: Props) =>
  <svg {...wrap(size)} {...p}><path d="M5 12l5 5L20 7" /></svg>;
export const Logo = ({ size = 56, ...p }: Props) => (
  // hanimo mark — Modol the Honey-Bee Bichon. Multi-color, full-fidelity
  // version of docs/branding/assets/hanimo-logo-compact.svg from hanimo-code.
  // Used in EmptyState as a hero — currentColor is intentionally NOT used
  // because the mascot's identity depends on the cream/amber/brown palette.
  <svg viewBox="0 0 64 64" width={size} height={size} fill="none" role="img" aria-label="hanimo" {...p}>
    {/* wings (translucent, behind body) */}
    <ellipse cx="20" cy="38" rx="7" ry="5" fill="#ffd089" opacity="0.55" transform="rotate(-15 20 38)"/>
    <ellipse cx="44" cy="38" rx="7" ry="5" fill="#ffd089" opacity="0.55" transform="rotate(15 44 38)"/>

    {/* bee body */}
    <ellipse cx="32" cy="44" rx="18" ry="12" fill="#f5a623"/>

    {/* stripes */}
    <rect x="18" y="40" width="28" height="3" rx="1" fill="#1a1410"/>
    <rect x="18" y="48" width="28" height="2.5" rx="1" fill="#1a1410" opacity="0.85"/>

    {/* amber highlight */}
    <ellipse cx="22" cy="42" rx="4" ry="1.6" fill="#ffd089" opacity="0.7"/>

    {/* head */}
    <circle cx="32" cy="26" r="14" fill="#f0e4d3"/>

    {/* fluffy fur ring */}
    <circle cx="32" cy="26" r="14.5" fill="none" stroke="#f7eedf" strokeWidth={0.8} opacity="0.7"/>

    {/* ears */}
    <ellipse cx="20" cy="24" rx="4" ry="6" fill="#f0e4d3" transform="rotate(-25 20 24)"/>
    <ellipse cx="44" cy="24" rx="4" ry="6" fill="#f0e4d3" transform="rotate(25 44 24)"/>

    {/* antennae */}
    <line x1="27" y1="14" x2="24" y2="8" stroke="#1a1410" strokeWidth={1.5} strokeLinecap="round"/>
    <line x1="37" y1="14" x2="40" y2="8" stroke="#1a1410" strokeWidth={1.5} strokeLinecap="round"/>
    <circle cx="23" cy="7" r="1.4" fill="#1a1410"/>
    <circle cx="41" cy="7" r="1.4" fill="#1a1410"/>

    {/* eyes */}
    <circle cx="27" cy="26" r="1.8" fill="#1a1410"/>
    <circle cx="37" cy="26" r="1.8" fill="#1a1410"/>
    <circle cx="27.5" cy="25.4" r="0.55" fill="#f7eedf"/>
    <circle cx="37.5" cy="25.4" r="0.55" fill="#f7eedf"/>

    {/* nose */}
    <ellipse cx="32" cy="31" rx="1.7" ry="1.3" fill="#1a1410"/>

    {/* slight smile */}
    <path d="M 30 34 Q 32 35.5 34 34" stroke="#1a1410" strokeWidth={0.9} strokeLinecap="round" fill="none"/>
  </svg>
);
