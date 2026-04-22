export function Footnote({ n }: { n: number }) {
  return <sup className="obs-footnote">[{n}]</sup>;
}
