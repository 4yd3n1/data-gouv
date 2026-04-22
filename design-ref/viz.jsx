// Data visualizations — pure SVG, no deps

// Sparkline
const Spark = ({ data, width = 100, height = 28, color = 'var(--fg)' }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v,i) => {
    const x = (i/(data.length-1)) * width;
    const y = height - ((v - min)/(max - min || 1)) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{display:'block'}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1" strokeLinejoin="round"/>
    </svg>
  );
};

// Small choropleth of France (synthetic — ~22 regional blobs on a grid)
// Uses a 12x11 grid, cells either present or not.
const FR_GRID = [
  '............',
  '....22 4....',
  '...3 4 3 5..',
  '..2 6 7 5 3.',
  '..4 8 9 6 4.',
  '.3 7 8 7 5 2',
  '..5 9 6 5 3.',
  '...4 5 6 4..',
  '....3 4 3...',
  '.....2 3....',
  '............',
];

const Choropleth = ({ width = 360, height = 340, cellSize = 22 }) => {
  const rows = FR_GRID.length;
  const cols = FR_GRID[0].length;
  const cw = cellSize, ch = cellSize;
  const ox = (width - cols*cw)/2, oy = (height - rows*ch)/2;
  const scale = (v) => {
    // 0-9 -> shades of red or blue
    if (v <= 3) return 'oklch(0.36 0.08 215 / 0.65)';
    if (v <= 5) return 'oklch(0.42 0.10 215 / 0.55)';
    if (v <= 6) return 'oklch(0.48 0.07 27 / 0.5)';
    if (v <= 7) return 'oklch(0.55 0.12 27 / 0.65)';
    if (v <= 8) return 'oklch(0.62 0.15 27 / 0.75)';
    return 'oklch(0.70 0.17 27 / 0.9)';
  };
  const cells = [];
  FR_GRID.forEach((row, r) => {
    [...row].forEach((ch2, c) => {
      if (ch2 === ' ' || ch2 === '.') return;
      const v = parseInt(ch2, 10);
      cells.push(
        <rect key={`${r}-${c}`} x={ox + c*cw} y={oy + r*ch} width={cw-2} height={ch-2} fill={scale(v)} stroke="var(--ink-0)" strokeWidth="0.5"/>
      );
    });
  });
  return (
    <svg width={width} height={height} style={{display:'block'}}>
      {cells}
    </svg>
  );
};

// Voting heatmap — 35 rows (weeks) x 20 cols (vote sequence)
const VoteHeatmap = ({ width = 560, height = 180, rows = 12, cols = 36 }) => {
  const cw = width / cols, ch = height / rows;
  const cells = [];
  // deterministic "random" from seed
  const rand = (i) => {
    const x = Math.sin(i * 9.381) * 43758.5453;
    return x - Math.floor(x);
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = rand(r*cols + c);
      let fill = 'var(--ink-2)';
      if (v > 0.85) fill = 'oklch(0.70 0.17 27 / 0.9)';
      else if (v > 0.70) fill = 'oklch(0.55 0.14 27 / 0.7)';
      else if (v > 0.55) fill = 'oklch(0.44 0.10 27 / 0.5)';
      else if (v > 0.40) fill = 'oklch(0.40 0.07 215 / 0.5)';
      else if (v > 0.25) fill = 'oklch(0.55 0.08 215 / 0.6)';
      else fill = 'oklch(0.70 0.08 215 / 0.75)';
      cells.push(<rect key={`${r}-${c}`} x={c*cw} y={r*ch} width={cw-1.5} height={ch-1.5} fill={fill}/>);
    }
  }
  return <svg width={width} height={height} style={{display:'block'}}>{cells}</svg>;
};

// Network graph — nodes clustered in three blobs
const NetworkGraph = ({ width = 560, height = 360 }) => {
  // deterministic positions
  const rand = (i,s=0) => { const x = Math.sin((i+s) * 12.9898) * 43758.5453; return x - Math.floor(x); };
  const clusters = [
    { cx: 150, cy: 140, n: 14, color: 'oklch(0.70 0.17 27)', label:'EXÉCUTIF' },
    { cx: 410, cy: 110, n: 12, color: 'oklch(0.75 0.07 215)', label:'LOBBIES' },
    { cx: 310, cy: 260, n: 16, color: 'oklch(0.68 0.09 80)',  label:'MÉDIAS' },
  ];
  const nodes = [];
  clusters.forEach((cl, i) => {
    for (let k = 0; k < cl.n; k++) {
      const r = 18 + rand(k, i*100) * 52;
      const a = rand(k+1, i*200) * Math.PI * 2;
      const x = cl.cx + Math.cos(a)*r;
      const y = cl.cy + Math.sin(a)*r;
      const size = 2 + rand(k+2, i*300)*4;
      nodes.push({ x, y, size, color: cl.color, cluster: i });
    }
  });
  // edges: within-cluster + a few cross-cluster
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i+1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (nodes[i].cluster === nodes[j].cluster && d < 42) edges.push([i,j, 0.12]);
      else if (nodes[i].cluster !== nodes[j].cluster && d < 180 && rand(i*j, 99) > 0.93) edges.push([i,j, 0.28]);
    }
  }
  return (
    <svg width={width} height={height} viewBox={`0 0 560 360`} style={{display:'block'}}>
      {edges.map(([a,b,op], i) => (
        <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke="var(--fg-faint)" strokeOpacity={op} strokeWidth="0.6"/>
      ))}
      {nodes.map((n,i) => (
        <circle key={i} cx={n.x} cy={n.y} r={n.size} fill={n.color} stroke="var(--ink-0)" strokeWidth="0.8"/>
      ))}
      {clusters.map((c,i) => (
        <text key={c.label} x={c.cx} y={c.cy + 110} textAnchor="middle" fill="var(--fg-mute)" fontFamily="var(--mono)" fontSize="9.5" letterSpacing="1.2">{c.label}</text>
      ))}
    </svg>
  );
};

// Bar rows (e.g., declarations by category)
const BarRows = ({ items, max, width = 280, barH = 14 }) => {
  const m = max || Math.max(...items.map(i=>i.v));
  return (
    <div style={{display:'flex', flexDirection:'column', gap: 10}}>
      {items.map((it, i) => (
        <div key={i} style={{display:'grid', gridTemplateColumns:'120px 1fr auto', alignItems:'center', gap: 10}}>
          <div className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--fg-mute)'}}>{it.label}</div>
          <div style={{position:'relative', height: barH, background:'var(--ink-2)'}}>
            <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${(it.v/m)*100}%`, background: it.color || 'var(--red)'}} />
          </div>
          <div className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--fg)', width: 44, textAlign:'right'}}>{it.display || it.v}</div>
        </div>
      ))}
    </div>
  );
};

// Timeline dots (HATVP declarations across years)
const TimelineDots = ({ width = 560, height = 90 }) => {
  const years = [2017,2018,2019,2020,2021,2022,2023,2024,2025,2026];
  const rand = (i) => { const x = Math.sin(i * 8.21) * 43758.5453; return x - Math.floor(x); };
  const dots = [];
  years.forEach((y, yi) => {
    const n = 4 + Math.floor(rand(yi) * 8);
    for (let k = 0; k < n; k++) {
      const x = (yi + rand(yi*30+k+1)*0.9) / years.length * width + 20;
      const row = Math.floor(rand(yi*60+k+9)*4);
      const yPos = 20 + row * 13;
      const anomaly = rand(yi*90+k) > 0.85;
      dots.push({ x, y: yPos, anomaly });
    }
  });
  return (
    <svg width={width} height={height} style={{display:'block'}}>
      {years.map((y, i) => (
        <g key={y}>
          <line x1={(i/years.length)*width + 20} y1={8} x2={(i/years.length)*width + 20} y2={height-18} stroke="var(--line)"/>
          <text x={(i/years.length)*width + 20} y={height-4} fill="var(--fg-dim)" fontFamily="var(--mono)" fontSize="9.5" letterSpacing="1">{y}</text>
        </g>
      ))}
      {dots.map((d,i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.anomaly?3.5:2} fill={d.anomaly?'var(--red)':'var(--fg-mute)'} opacity={d.anomaly?1:0.7}/>
      ))}
    </svg>
  );
};

Object.assign(window, { Spark, Choropleth, VoteHeatmap, NetworkGraph, BarRows, TimelineDots });
