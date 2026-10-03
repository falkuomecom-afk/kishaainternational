import React from "react";

/**
 * Minimal, safe markdown renderer for CMS-authored content.
 * Supports: ## / ### headings, paragraphs, - lists, 1. lists, **bold**, [text](url).
 * No raw HTML is rendered (XSS-safe by construction).
 */
function inline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let rest = text;
  let k = 0;
  while (rest.length) {
    const bold = rest.match(/^\*\*([^*]+)\*\*/);
    if (bold) {
      parts.push(<strong key={k++}>{bold[1]}</strong>);
      rest = rest.slice(bold[0].length);
      continue;
    }
    const link = rest.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (link) {
      parts.push(
        <a key={k++} href={link[2]} target="_blank" rel="noopener noreferrer">
          {link[1]}
        </a>,
      );
      rest = rest.slice(link[0].length);
      continue;
    }
    const next = rest.search(/\*\*|\[[^\]]+\]\(/);
    if (next === -1) {
      parts.push(rest);
      break;
    }
    if (next > 0) {
      parts.push(rest.slice(0, next));
      rest = rest.slice(next);
    } else {
      parts.push(rest[0]);
      rest = rest.slice(1);
    }
  }
  return parts;
}

export function Markdown({ children }: { children: string }) {
  if (/<[a-z][\s\S]*>/i.test(children ?? "")) {
    return (
      <div
        className="cms-prose"
        dangerouslySetInnerHTML={{ __html: children }}
      />
    );
  }
  const lines = (children ?? "").split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(<h3 key={key++}>{inline(line.slice(4))}</h3>);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(<h2 key={key++}>{inline(line.slice(3))}</h2>);
      i++;
      continue;
    }
    if (/^[-•] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-•] /.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push(
        <ul key={key++}>
          {items.map((it, j) => (
            <li key={j}>{inline(it)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      blocks.push(
        <ol key={key++}>
          {items.map((it, j) => (
            <li key={j}>{inline(it)}</li>
          ))}
        </ol>,
      );
      continue;
    }
    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(##|###|[-•]|\d+\. )/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(<p key={key++}>{inline(para.join(" "))}</p>);
  }
  return <div className="cms-prose">{blocks}</div>;
}
