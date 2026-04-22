// Shared editorial chrome: topbar, footer, rail cards, chips, rules

const Logo = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" stroke="var(--red)" strokeWidth="1.2"/>
    <circle cx="12" cy="12" r="4.2" stroke="var(--fg)" strokeWidth="1.2"/>
    <circle cx="12" cy="12" r="1.4" fill="var(--red)"/>
    <path d="M2 12 L22 12 M12 2 L12 22" stroke="var(--line-2)" strokeWidth="0.6"/>
  </svg>
);

const Wordmark = ({ small }) => (
  <div style={{display:'flex', alignItems:'center', gap: small ? 8 : 10}}>
    <Logo size={small ? 16 : 18} />
    <span className="serif" style={{fontStyle:'italic', fontSize: small ? 15 : 17, letterSpacing:'-0.01em'}}>L’Observatoire</span>
  </div>
);

const TopBar = ({ compact = false }) => (
  <header style={{
    display:'grid',
    gridTemplateColumns:'auto 1fr auto',
    alignItems:'center',
    gap: 24,
    padding: compact ? '14px 32px' : '18px 40px',
    borderBottom:'1px solid var(--line)',
    background:'var(--ink-0)',
    position:'relative',
    zIndex: 2,
  }}>
    <div style={{display:'flex', alignItems:'center', gap: 18}}>
      <Wordmark />
      <span className="mono" style={{color:'var(--fg-dim)', fontSize:'var(--fs-mono-xs)'}}>//</span>
      <span className="mono" style={{color:'var(--fg-mute)', fontSize:'var(--fs-mono-xs)'}}>BUREAU DES DONNÉES PUBLIQUES</span>
    </div>
    <div style={{display:'flex', justifyContent:'center'}}>
      <div className="obs-input" style={{width: '100%', maxWidth: 440}}>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor"/><path d="M11 11 L14 14" stroke="currentColor"/></svg>
        <span>CHERCHER UN ÉLU, UN VOTE, UNE DÉCLARATION…</span>
        <span style={{marginLeft:'auto', color:'var(--fg-faint)'}}>⌘K</span>
      </div>
    </div>
    <nav style={{display:'flex', gap: 22}}>
      {['DOSSIERS','SIGNAUX','ANNUAIRE','TERRITOIRE','MÉTHODE'].map((l,i) => (
        <a key={l} className="mono" href="#" style={{
          color: i===0?'var(--fg)':'var(--fg-mute)',
          fontSize:'var(--fs-mono-xs)',
          textDecoration:'none',
          borderBottom: i===0?'1px solid var(--red)':'1px solid transparent',
          paddingBottom: 4,
        }}>{l}</a>
      ))}
    </nav>
  </header>
);

const Dateline = ({ edition = 'ÉDITION N°247', date = 'MERCREDI 22 AVRIL 2026', extra }) => (
  <div style={{
    display:'flex', alignItems:'center', gap: 14,
    padding:'10px 40px',
    borderBottom:'1px solid var(--line)',
    color:'var(--fg-mute)',
    background:'var(--ink-0)',
  }}>
    <span className="pulse" />
    <span className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--red)'}}>EN DIRECT</span>
    <span className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--fg-dim)'}}>//</span>
    <span className="mono" style={{fontSize:'var(--fs-mono-xs)'}}>{edition}</span>
    <span className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--fg-dim)'}}>//</span>
    <span className="mono" style={{fontSize:'var(--fs-mono-xs)'}}>{date}</span>
    <span style={{flex:1}} />
    {extra}
    <span className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--fg-dim)'}}>MISE À JOUR 14:32 CET</span>
  </div>
);

const SrcChip = ({ items = [] }) => (
  <span className="src-chip">
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
      <rect x="1.5" y="2" width="9" height="8" stroke="currentColor" strokeWidth="1"/>
      <path d="M3 4.5 H9 M3 6.5 H9 M3 8.5 H7" stroke="currentColor" strokeWidth="0.8"/>
    </svg>
    <span className="k">SRC</span>
    {items.map((s,i)=> (
      <React.Fragment key={i}>
        <span className="dot"/>
        <span>{s}</span>
      </React.Fragment>
    ))}
  </span>
);

const ReadLink = ({ children = 'LIRE LE DOSSIER' }) => (
  <a href="#" className="lnk-arrow">
    <span>{children}</span>
    <span>→</span>
  </a>
);

const Footnote = ({ n }) => (
  <sup className="mono" style={{color:'var(--red)', fontSize: 9, letterSpacing:'.05em', marginLeft: 1, verticalAlign:'super'}}>[{n}]</sup>
);

const Footer = () => (
  <footer style={{
    borderTop:'1px solid var(--line)',
    padding:'28px 40px 24px',
    display:'grid',
    gridTemplateColumns:'1.3fr 1fr 1fr 1fr',
    gap: 36,
    color:'var(--fg-mute)',
    fontSize: 13,
    background:'var(--ink-0)',
  }}>
    <div>
      <Wordmark small />
      <p style={{marginTop: 12, color:'var(--fg-mute)', lineHeight: 1.55, maxWidth: 360}}>
        Plateforme indépendante d’intelligence civique. Surveille les institutions démocratiques françaises. Fondée sur 800 000+ lignes de données publiques vérifiables.
      </p>
      <div style={{marginTop: 16, display:'flex', gap: 10, alignItems:'center'}}>
        <span className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--fg-dim)'}}>V 5.8 · STABLE</span>
        <span className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--fg-dim)'}}>//</span>
        <span className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--fg-dim)'}}>ISSN 2847-1120</span>
      </div>
    </div>
    {[
      ['MÉTHODOLOGIE', ['Sources de données','Définition des signaux','Mise à jour des données','Politique de correction','Charte éditoriale']],
      ['ACCÈS',        ['Patrimoine culturel','Registre des votes','data.gouv.fr','À propos du Bureau','API / Export']],
      ['CONTRIBUER',   ['Signaler une erreur','Proposer une enquête','Lanceurs d’alerte','Transparence financière','Newsletter']],
    ].map(([t, links]) => (
      <div key={t}>
        <div className="mono" style={{color:'var(--fg-dim)', fontSize:'var(--fs-mono-xs)', marginBottom: 14}}>{t}</div>
        {links.map(l => <div key={l} style={{marginBottom: 8}}><a href="#" style={{color:'var(--fg-mute)', textDecoration:'none'}}>{l}</a></div>)}
      </div>
    ))}
  </footer>
);

Object.assign(window, { Logo, Wordmark, TopBar, Dateline, SrcChip, ReadLink, Footnote, Footer });
