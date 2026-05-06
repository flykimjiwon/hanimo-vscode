import { Check } from '../icons';
import { ChatTurn } from '../state';
import { CodeBlock } from './CodeBlock';
import { Markdown } from './Markdown';

interface Props {
  turn: ChatTurn;
  streaming?: boolean; // true when this is the live-streaming assistant turn
  onApply: (filePath: string, content: string) => void;
  onDiff?: (filePath: string, content: string) => void;
}

export function Turn({ turn, streaming, onApply, onDiff }: Props) {
  if (turn.kind === 'user') {
    return <div class="turn user"><div class="bubble">{turn.text}</div></div>;
  }
  if (turn.kind === 'assistant') {
    // Empty-text streaming: show the typing dots until first chunk arrives.
    if (streaming && !turn.text) {
      return (
        <div class="turn assistant">
          <div class="bubble">
            <div class="typing-indicator"><span class="dot" /><span class="dot" /><span class="dot" /></div>
          </div>
        </div>
      );
    }
    return (
      <div class="turn assistant">
        <div class="bubble">
          {renderRich(turn.text, onApply, onDiff)}
          {streaming && <span class="stream-cursor" />}
        </div>
      </div>
    );
  }
  return (
    <details class="turn tool" open={turn.result === undefined}>
      <summary>
        <span>⚙</span>
        <span class="name">{turn.name}</span>
        {turn.result === undefined ? (
          <span class="spinner" />
        ) : turn.aborted ? (
          <span class="badge err">중단</span>
        ) : (
          <span class="badge ok"><Check size={10} /> 완료</span>
        )}
      </summary>
      {turn.args && <pre>{prettifyArgs(turn.args)}</pre>}
      {turn.result !== undefined && <pre>{turn.result}</pre>}
    </details>
  );
}

function prettifyArgs(args: string): string {
  try { return JSON.stringify(JSON.parse(args), null, 2); } catch { return args; }
}

// Renders text with ``` code blocks split out to <CodeBlock>; the rest is
// passed through the Markdown renderer so headings/bold/lists/inline-code
// all render properly.
function renderRich(
  text: string,
  onApply: (p: string, c: string) => void,
  onDiff?: (p: string, c: string) => void,
) {
  const parts: any[] = [];
  const re = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<Markdown key={`t${i}`} text={text.slice(last, m.index)} />);
    parts.push(<CodeBlock key={`c${i}`} lang={m[1]} code={m[2]} onApply={onApply} onDiff={onDiff} />);
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) parts.push(<Markdown key={`t${i}`} text={text.slice(last)} />);
  return parts.length > 0 ? parts : <Markdown text={text} />;
}
