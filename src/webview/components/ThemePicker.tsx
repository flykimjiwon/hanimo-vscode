import { useEffect, useState } from 'preact/hooks';

// Themes are defined in styles.css as `body.t-<id>` blocks. The default
// (id=null) inherits VS Code's host theme — the option label is "VS Code".
//
// `kind` is shown as a small dim badge in the picker. Light themes assume a
// near-white surface; dark assume near-black.
//
// Persistence: the same `hanimo-theme` localStorage key is shared with the
// hanimo-code-desktop ThemePicker so a user's preference travels between
// the two surfaces if they happen to use both.
type ThemeKind = 'dark' | 'light';
interface Theme {
  id: string | null;
  name: string;
  swatch: string;
  kind: ThemeKind;
}

const THEMES: Theme[] = [
  { id: null,           name: 'VS Code',       swatch: 'linear-gradient(135deg,#0078d4,#005a9e)', kind: 'dark' },
  { id: 't-honey',      name: 'Honey',         swatch: 'linear-gradient(135deg,#f5a623,#e8a317)', kind: 'dark' },
  { id: 't-slate',      name: 'Slate',         swatch: 'linear-gradient(135deg,#3b82f6,#1e3a8a)', kind: 'dark' },
  { id: 't-cursor',     name: 'Cursor',        swatch: '#f54e00',                                  kind: 'dark' },
  { id: 't-linear',     name: 'Linear',        swatch: '#7c3aed',                                  kind: 'dark' },
  { id: 't-github',     name: 'GitHub Dark',   swatch: '#58a6ff',                                  kind: 'dark' },
  { id: 't-dracula',    name: 'Dracula',       swatch: '#bd93f9',                                  kind: 'dark' },
  { id: 't-nord',       name: 'Nord',          swatch: '#88c0d0',                                  kind: 'dark' },
  { id: 't-onedark',    name: 'One Dark',      swatch: '#61afef',                                  kind: 'dark' },
  { id: 't-monokai',    name: 'Monokai',       swatch: '#ffd866',                                  kind: 'dark' },
  { id: 't-solarized',  name: 'Solarized',     swatch: '#268bd2',                                  kind: 'dark' },
  { id: 't-claude',     name: 'Claude',        swatch: '#c96442',                                  kind: 'light' },
  { id: 't-vercel',     name: 'Vercel',        swatch: 'linear-gradient(135deg,#000,#fff)',       kind: 'light' },
];

const STORAGE_KEY = 'hanimo-theme';

export function applyStoredTheme() {
  const saved = localStorage.getItem(STORAGE_KEY) || '';
  document.body.className = saved;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ThemePicker({ open, onClose }: Props) {
  const [current, setCurrent] = useState<string>(() => localStorage.getItem(STORAGE_KEY) || '');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const select = (id: string | null) => {
    const value = id || '';
    setCurrent(value);
    document.body.className = value;
    localStorage.setItem(STORAGE_KEY, value);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--hanimo-bg-elev)',
          border: '1px solid var(--hanimo-border)',
          borderRadius: 'var(--hanimo-radius-lg)',
          padding: 16,
          width: 320,
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--hanimo-fg)' }}>Theme</span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 0, color: 'var(--hanimo-fg-dim)',
              cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 4,
            }}
            aria-label="Close"
          >×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {THEMES.map((t) => {
            const isActive = current === (t.id || '');
            return (
              <button
                key={t.id || 'default'}
                onClick={() => select(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px',
                  background: isActive ? 'var(--hanimo-accent-glow)' : 'transparent',
                  border: 0, borderRadius: 'var(--hanimo-radius-sm)',
                  cursor: 'pointer',
                  color: 'var(--hanimo-fg)', fontSize: 12,
                  textAlign: 'left', width: '100%',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background =
                    'color-mix(in srgb, var(--hanimo-accent) 8%, transparent)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                <span style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: t.swatch, flexShrink: 0,
                  border: '1px solid rgba(255,255,255,0.12)',
                }} />
                <span style={{ flex: 1 }}>{t.name}</span>
                <span style={{ fontSize: 10, color: 'var(--hanimo-fg-faint)' }}>
                  {t.kind === 'dark' ? 'Dark' : 'Light'}
                </span>
                {isActive && (
                  <span style={{ color: 'var(--hanimo-accent)', fontSize: 12 }}>✓</span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{
          marginTop: 12, paddingTop: 10,
          borderTop: '1px solid var(--hanimo-border)',
          fontSize: 10, color: 'var(--hanimo-fg-faint)',
        }}>
          Themes sync with hanimo-code-desktop via shared localStorage key.
        </div>
      </div>
    </div>
  );
}
