import Link from "next/link";
import type { ReactNode } from "react";

/** Turns [label](/address/) inside plain text (e.g. content/home.json) into links. */
export function withLinks(text: string, className = "font-semibold text-accent-strong underline decoration-accent/50 underline-offset-4 hover:decoration-accent"): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const [, label, href] = m;
    out.push(href.startsWith("/") ? <Link key={m.index} href={href} className={className}>{label}</Link> : <a key={m.index} href={href} target="_blank" rel="noopener noreferrer" className={className}>{label}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
