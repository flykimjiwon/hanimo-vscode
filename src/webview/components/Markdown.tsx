// Tiny safe Markdown renderer. Handles: headings, bold, italic, code (inline+block),
// links, lists, blockquote, hr. Skips raw HTML — content is escaped before
// pattern replacement. Not CommonMark-complete; aims for "good enough for docs".
import { JSX } from 'preact';

interface Props {
  text: string;
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

function inline(s: string): string {
  // order matters: code, then bold, then italic, then links
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, txt, url) => {
    if (!/^https?:|^mailto:/.test(url)) return `${txt} (${url})`;
    return `<a href="${url}" target="_blank" rel="noopener">${txt}</a>`;
  });
  return s;
}

function renderBlocks(src: string): string {
  const lines = src.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // fenced code
    const m = line.match(/^```([\w-]*)/);
    if (m) {
      const lang = m[1];
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++;
      out.push(`<pre class="md-code"${lang ? ` data-lang="${esc(lang)}"` : ''}><code>${esc(buf.join('\n'))}</code></pre>`);
      continue;
    }
    // heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const lvl = h[1].length;
      out.push(`<h${lvl} class="md-h md-h${lvl}">${inline(h[2])}</h${lvl}>`);
      i++; continue;
    }
    // hr
    if (/^-{3,}$/.test(line.trim())) { out.push('<hr class="md-hr" />'); i++; continue; }
    // blockquote
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      out.push(`<blockquote class="md-quote">${inline(buf.join('\n'))}</blockquote>`);
      continue;
    }
    // unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\s*[-*]\s+/, ''))}</li>`);
        i++;
      }
      out.push(`<ul class="md-list">${items.join('')}</ul>`);
      continue;
    }
    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\s*\d+\.\s+/, ''))}</li>`);
        i++;
      }
      out.push(`<ol class="md-list">${items.join('')}</ol>`);
      continue;
    }
    // blank
    if (!line.trim()) { i++; continue; }
    // paragraph (collect contiguous lines)
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|>\s|```|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])) {
      buf.push(lines[i]); i++;
    }
    out.push(`<p class="md-p">${inline(buf.join(' '))}</p>`);
  }
  return out.join('\n');
}

export function Markdown({ text }: Props): JSX.Element {
  // dangerouslySetInnerHTML — input is locally-authored .md from the user.
  return <div class="markdown" dangerouslySetInnerHTML={{ __html: renderBlocks(text) }} />;
}
