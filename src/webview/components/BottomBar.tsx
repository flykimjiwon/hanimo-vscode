import { Monitor, Shield, ChevronDown } from '../icons';

interface Props {
  cwd: string | null;
  model: string | null;
  totalTokens: number;
  onClickLocal: () => void;
  onClickPermissions: () => void;
}

export function BottomBar({ cwd, model, totalTokens, onClickLocal, onClickPermissions }: Props) {
  const folder = cwd ? cwd.split(/[\\/]/).pop() || cwd : 'Local';
  return (
    <div class="bottom-bar">
      <span class="chip" title={cwd || '워크스페이스 정보'} onClick={onClickLocal}>
        <Monitor /> {folder} <ChevronDown size={10} />
      </span>
      <span class="chip" title="도구 권한 정책" onClick={onClickPermissions}>
        <Shield /> 권한 <ChevronDown size={10} />
      </span>
      <span class="stat">
        {model && <span title={model}>{shortModel(model)}</span>}
        {totalTokens > 0 && <span> · {totalTokens.toLocaleString()} tok</span>}
      </span>
    </div>
  );
}

function shortModel(id: string): string {
  const tail = id.split('/').pop() || id;
  return tail.length > 20 ? tail.slice(0, 18) + '…' : tail;
}
