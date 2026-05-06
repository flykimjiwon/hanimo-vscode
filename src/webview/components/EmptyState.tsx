import { Logo } from '../icons';
import { t, useLocale } from '../i18n';

interface Props {
  onSuggest: (prompt: string) => void;
}

export function EmptyState({ onSuggest }: Props) {
  useLocale();
  const suggestions = [t('suggest_1'), t('suggest_2'), t('suggest_3')];
  return (
    <div class="empty">
      <div class="logo"><Logo size={56} /></div>
      <div class="title">{t('empty_title')}</div>
      <div class="subtitle">{t('empty_subtitle')}</div>
      <div class="pills">
        {suggestions.map((s) => (<span class="pill" onClick={() => onSuggest(s)}>{s}</span>))}
      </div>
    </div>
  );
}
