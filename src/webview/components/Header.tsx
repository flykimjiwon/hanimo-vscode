import { ViewName } from '../state';
import { t, useLocale } from '../i18n';

interface Props {
  view: ViewName;
  onNavigate: (v: ViewName) => void;
}

// VS Code already renders +/history/settings buttons in the view title bar
// (from package.json `menus.view/title`), and the panel's chrome owns
// expand/close. So our header only carries the tab strip — no duplicate
// action icons.
export function Header({ view, onNavigate }: Props) {
  useLocale();
  return (
    <div class="header">
      <div class="tabs">
        <span class={`tab ${view === 'chat' ? 'active' : ''}`} onClick={() => onNavigate('chat')}>{t('tab_chat')}</span>
        <span class={`tab ${view === 'history' ? 'active' : ''}`} onClick={() => onNavigate('history')}>{t('tab_history')}</span>
        <span class={`tab ${view === 'knowledge' ? 'active' : ''}`} onClick={() => onNavigate('knowledge')}>{t('tab_knowledge')}</span>
        <span class={`tab ${view === 'skills' ? 'active' : ''}`} onClick={() => onNavigate('skills')}>{t('tab_skills')}</span>
      </div>
    </div>
  );
}
