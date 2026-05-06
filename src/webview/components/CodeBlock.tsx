import { useState } from 'preact/hooks';

interface Props {
  lang: string;
  code: string;
  onApply: (filePath: string, content: string) => void;
  onDiff?: (filePath: string, content: string) => void;
}

// First line of the form `// path/to/file.ext` is treated as the apply target.
const PATH_HINT = /^[\s]*(?:\/\/|#|--)[\s]*(?:file:?\s*)?([\w./\-_]+\.[a-zA-Z0-9]+)\s*$/;

export function CodeBlock({ lang, code, onApply, onDiff }: Props) {
  const [copied, setCopied] = useState(false);
  const trimmed = code.replace(/\n$/, '');
  const firstLine = trimmed.split('\n', 1)[0];
  const m = firstLine.match(PATH_HINT);
  const target = m ? m[1] : null;
  const body = target ? trimmed.split('\n').slice(1).join('\n') : trimmed;

  return (
    <div class="code-block">
      <pre><code>{body}</code></pre>
      <div class="actions">
        <button class="mini-btn" onClick={() => {
          navigator.clipboard?.writeText(body);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}>{copied ? '복사됨' : '복사'}</button>
        {target && onDiff && (
          <button class="mini-btn" onClick={() => onDiff(target, body)} title="Diff 미리보기">Diff</button>
        )}
        {target && (
          <button class="mini-btn" onClick={() => onApply(target, body)} title={`${target} 에 적용`}>
            적용 → {shortPath(target)}
          </button>
        )}
        {lang && <span class="mini-btn" style={{ pointerEvents: 'none' }}>{lang}</span>}
      </div>
    </div>
  );
}

function shortPath(p: string): string {
  return p.length > 22 ? '…' + p.slice(-22) : p;
}
