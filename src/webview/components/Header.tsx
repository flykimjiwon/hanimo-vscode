import { ViewName } from '../state';
import { t, useLocale } from '../i18n';

interface Props {
  view: ViewName;
  onNavigate: (v: ViewName) => void;
  onOpenThemePicker: () => void;
}

// VS Code already renders +/history/settings buttons in the view title bar
// (from package.json `menus.view/title`), and the panel's chrome owns
// expand/close. The header carries the tab strip plus a single trailing
// action: the theme palette toggle, which is custom to hanimo and has no
// VS Code-host equivalent.
export function Header({ view, onNavigate, onOpenThemePicker }: Props) {
  useLocale();
  return (
    <div class="header">
      <div class="tabs">
        <span class={`tab ${view === 'chat' ? 'active' : ''}`} onClick={() => onNavigate('chat')}>{t('tab_chat')}</span>
        <span class={`tab ${view === 'history' ? 'active' : ''}`} onClick={() => onNavigate('history')}>{t('tab_history')}</span>
        <span class={`tab ${view === 'knowledge' ? 'active' : ''}`} onClick={() => onNavigate('knowledge')}>{t('tab_knowledge')}</span>
        <span class={`tab ${view === 'skills' ? 'active' : ''}`} onClick={() => onNavigate('skills')}>{t('tab_skills')}</span>
      </div>
      <div class="actions">
        <button
          class="icon-btn"
          title="Theme"
          aria-label="Theme"
          onClick={onOpenThemePicker}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 1.5a6.5 6.5 0 1 0 0 13c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.4-1-.24-.26-.4-.61-.4-1 0-.83.67-1.5 1.5-1.5h1.8A2.5 2.5 0 0 0 14.5 7c0-3.04-2.91-5.5-6.5-5.5z" />
            <circle cx="5" cy="6.5" r="0.85" fill="currentColor" stroke="none" />
            <circle cx="8" cy="4.5" r="0.85" fill="currentColor" stroke="none" />
            <circle cx="11" cy="6.5" r="0.85" fill="currentColor" stroke="none" />
          </svg>
        </button>
      </div>
    </div>
  );
}
