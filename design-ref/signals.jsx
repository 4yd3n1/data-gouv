// Live signals rail — multiple densities

const SIGNALS = [
  { type:'CONFLITS', tone:'red', role:'DÉPUTÉ', name:'Olivier FAYSSAT', detail:'5 participations déclarées en séance sur dossiers où participations financières non-déclarées', score: 87, delta: '+2' },
  { type:'ÉCARTS HATVP', tone:'amber', role:'COMPTES PUBLICS', name:'David AMIEL', detail:'2023 — actions Lobby contre-intérêt déclaré', score: 72, delta: '+1' },
  { type:'PORTES TOURNANTES', tone:'red', role:'PORTE-PAROLE / ÉNERGIE', name:'Maud BREGEON', detail:'Ancienne cadre privée recouvrant Porte-parole / Énergie', score: 81, delta: '—' },
  { type:'VOTES ALIGNÉS', tone:'verified', role:'GROUPE RN', name:'47 députés', detail:'Séquence de 12 votes à l’unisson sur la loi immigration — corrélation 0.98', score: 64, delta: '+5' },
  { type:'LOBBYING', tone:'red', role:'PRÉSIDENT DE LA RÉPUBLIQUE', name:'Emmanuel MACRON', detail:'1,289 actions de lobbying ciblant Président de la République depuis 2022', score: 93, delta: '+11' },
  { type:'CONFLITS', tone:'red', role:'DÉPUTÉ', name:'Jean-Pierre BATAILLE', detail:'2 participations déclarées', score: 58, delta: '+0' },
  { type:'FINANCEMENT', tone:'amber', role:'CIRC. 12ᵉ / PARIS', name:'Comité de soutien LR', detail:'Écart 38 k€ entre comptes CNCCFP et dépenses constatées', score: 69, delta: '+2' },
];

const toneClass = (t) => t==='red' ? '' : t==='verified' ? 'sig-tag--verified' : t==='amber' ? 'sig-tag--amber' : 'sig-tag--neutral';

const SignalCard = ({ s, compact = false, showScore = true }) => (
  <article style={{
    padding: compact ? '12px 14px' : '14px 16px',
    borderTop:'1px solid var(--line)',
    position:'relative',
  }}>
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8}}>
      <span className={`sig-tag ${toneClass(s.tone)}`}>{s.type}</span>
      <span className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--fg-dim)'}}>{s.role}</span>
    </div>
    <div style={{fontFamily:'var(--serif)', fontSize: compact ? 15 : 16, letterSpacing:'-0.005em', color:'var(--fg)'}}>
      {s.name}
    </div>
    {!compact && (
      <div style={{color:'var(--fg-mute)', fontSize: 12.5, marginTop: 5, lineHeight: 1.4, textWrap:'pretty'}}>
        {s.detail}
      </div>
    )}
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginTop: 10}}>
      <a href="#" className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--fg)', textDecoration:'none', letterSpacing:'.10em'}}>
        ANALYSER LE DOSSIER →
      </a>
      {showScore && (
        <div className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--fg-dim)', display:'flex', gap: 8}}>
          <span>IDX {s.score}</span>
          <span style={{color: s.delta.startsWith('+') && s.delta !== '+0' ? 'var(--red)' : 'var(--fg-dim)'}}>{s.delta}</span>
        </div>
      )}
    </div>
  </article>
);

const SignalsRail = ({ items = SIGNALS.slice(0,6), compact = false }) => (
  <aside style={{
    border:'1px solid var(--line)',
    background:'var(--ink-1)',
    height:'100%',
    display:'flex',
    flexDirection:'column',
  }}>
    <header style={{
      padding:'12px 16px',
      display:'flex', alignItems:'center', gap: 10,
      borderBottom:'1px solid var(--line)',
    }}>
      <span className="pulse" />
      <span className="mono eyebrow--red" style={{fontSize:'var(--fs-mono-sm)'}}>SIGNAUX EN DIRECT</span>
      <span style={{flex:1}} />
      <span className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--fg-dim)'}}>MISE À JOUR AUTO</span>
    </header>
    <div style={{flex:1, overflow:'hidden'}}>
      {items.map((s,i) => <SignalCard key={i} s={s} compact={compact} />)}
    </div>
    <footer style={{
      padding:'12px 16px',
      borderTop:'1px solid var(--line)',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      fontFamily:'var(--mono)', fontSize:'var(--fs-mono-xs)', color:'var(--fg-mute)',
    }}>
      <span>197 SIGNAUX · <span style={{color:'var(--red)'}}>18 CRITIQUES</span></span>
      <a href="#" style={{color:'var(--fg)', textDecoration:'none'}}>VOIR TOUS →</a>
    </footer>
  </aside>
);

Object.assign(window, { SIGNALS, SignalCard, SignalsRail });
