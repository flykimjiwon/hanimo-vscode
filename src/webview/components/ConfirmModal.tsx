import { t, useLocale } from '../i18n';

// Lightweight confirm dialog for tools whose policy is "ask".
interface Props {
  toolName: string;
  args: string;
  onApprove: () => void;
  onDeny: () => void;
}

export function ConfirmModal({ toolName, args, onApprove, onDeny }: Props) {
  useLocale();
  let pretty = args;
  try { pretty = JSON.stringify(JSON.parse(args), null, 2); } catch { /* keep raw */ }
  return (
    <div class="modal-backdrop">
      <div class="modal">
        <div class="modal-header">
          ⚠ <strong>{toolName}</strong> {t('confirm_msg')}
        </div>
        <pre class="modal-args">{pretty}</pre>
        <div class="modal-actions">
          <button class="btn-secondary" onClick={onDeny}>{t('deny')}</button>
          <button class="btn-primary" onClick={onApprove}>{t('allow')}</button>
        </div>
      </div>
    </div>
  );
}
