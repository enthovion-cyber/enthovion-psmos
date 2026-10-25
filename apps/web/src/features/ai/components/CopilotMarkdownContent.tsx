'use client';

import React from 'react';

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const code = part.slice(1, -1);
      const upper = code.toUpperCase();
      let toneClass = 'bg-slate-800/90 text-sky-300 border-slate-700/80';
      if (upper.includes('SUSPEND') || upper.includes('OPEN') || upper.includes('PENDING') || upper.includes('HIGH')) {
        toneClass = 'bg-amber-950/70 text-amber-300 border-amber-500/30';
      } else if (upper.includes('EXPIRED') || upper.includes('FAIL') || upper.includes('CONFLICT') || upper.includes('BLOCK')) {
        toneClass = 'bg-rose-950/70 text-rose-300 border-rose-500/30';
      } else if (upper.includes('VERIFIED') || upper.includes('BRIEFED') || upper.includes('READY') || upper.includes('CLEAR') || upper.includes('ACTIVE')) {
        toneClass = 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30';
      }
      return (
        <code
          key={idx}
          className={`px-1.5 py-0.5 rounded border font-mono text-[11px] font-semibold ${toneClass}`}
        >
          {code}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={idx} className="italic text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

export function CopilotMarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i] ?? '';
    const line = rawLine.trim();

    if (!line) {
      i++;
      continue;
    }

    // Horizontal Rule
    if (/^---+$/.test(line)) {
      elements.push(<hr key={`hr-${i}`} className="my-3 border-slate-800/90" />);
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-sm font-bold text-white tracking-tight mt-3 mb-1.5">
          {renderInlineMarkdown(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-base font-bold text-white tracking-tight mt-3.5 mb-2">
          {renderInlineMarkdown(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    // Markdown Table
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && (lines[i] ?? '').trim().startsWith('|')) {
        tableLines.push((lines[i] ?? '').trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const parseRow = (rowStr: string) =>
          rowStr
            .split('|')
            .slice(1, -1)
            .map((cell) => cell.trim());

        const headers = parseRow(tableLines[0] ?? '');
        const bodyRows = tableLines
          .slice(1)
          .filter((r) => !/^\|[\s\-:|]+\|$/.test(r))
          .map(parseRow);

        elements.push(
          <div key={`table-${i}`} className="my-2.5 overflow-x-auto rounded-xl border border-slate-800/90 bg-[#080f1e]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0a1326] text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  {headers.map((h, hIdx) => (
                    <th key={hIdx} className="px-3 py-2">
                      {renderInlineMarkdown(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-900/50 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-slate-200 align-top">
                        {renderInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Bullet List
    if (line.startsWith('* ') || line.startsWith('- ')) {
      const listItems: string[] = [];
      while (
        i < lines.length &&
        ((lines[i] ?? '').trim().startsWith('* ') || (lines[i] ?? '').trim().startsWith('- '))
      ) {
        listItems.push((lines[i] ?? '').trim().slice(2));
        i++;
      }

      elements.push(
        <ul key={`ul-${i}`} className="my-1.5 space-y-1.5 pl-4 list-disc marker:text-blue-400 text-slate-200">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Paragraph
    elements.push(
      <p key={`p-${i}`} className="my-1.5 text-slate-200 leading-relaxed">
        {renderInlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1 font-sans">{elements}</div>;
}
