// Variant A — Édition
// Refined editorial. Close to current screenshot but elevated:
// - proper dateline ribbon, edition counter, live indicator
// - restructured hero with two columns: deck + kicker + byline | interactive choropleth
// - secondary stories: 3 across, with sparkline "pulse" previews
// - signals rail with scores and deltas
// - footnote superscripts linking to methodology
// - editorial sign-offs

const VariantA = () => {
  const W = 1440;
  return (
    <div className="obs-artboard obs-grain" style={{width: W}}>
      <TopBar />
      <Dateline />

      {/* Hero */}
      <section style={{
        display:'grid',
        gridTemplateColumns: '1.15fr 340px',
        gap: 40,
        padding:'36px 40px 28px',
      }}>
        {/* Left: lead */}
        <div>
          <div style={{display:'flex', alignItems:'center', gap: 12, marginBottom: 22}}>
            <span className="mono eyebrow--red" style={{fontSize:'var(--fs-mono-sm)'}}>◆ ENQUÊTE PRINCIPALE</span>
            <span className="mono" style={{color:'var(--fg-dim)', fontSize:'var(--fs-mono-xs)'}}>//</span>
            <span className="mono" style={{color:'var(--fg-mute)', fontSize:'var(--fs-mono-xs)'}}>DOSSIER N°12 · AVRIL 2026</span>
            <span className="mono" style={{color:'var(--fg-dim)', fontSize:'var(--fs-mono-xs)'}}>//</span>
            <span className="mono" style={{color:'var(--fg-mute)', fontSize:'var(--fs-mono-xs)'}}>LECTURE 18 MIN · 47 SOURCES</span>
          </div>

          <h1 className="hd" style={{
            fontSize: 58, lineHeight: 1.02, margin: 0, letterSpacing:'-0.02em',
            fontWeight: 400,
          }}>
            Bilan Macron : deux mandats,<br/>
            neuf ans de données,<br/>
            <em>ce que les chiffres révèlent.</em>
          </h1>

          <p style={{
            fontFamily:'var(--serif)', fontSize: 19, lineHeight: 1.55,
            color:'var(--fg)', marginTop: 22, maxWidth: 640, textWrap:'pretty',
          }}>
            Analyse chiffrée de la présidence Macron (2017–2026) sur sept dimensions —
            économie, santé, droits, environnement, élites, cohésion sociale. Plus d’un
            million de personnes sous le seuil de pauvreté<Footnote n="1"/> pendant que
            les milliardaires doublaient leur fortune<Footnote n="2"/>.
          </p>

          <div style={{display:'flex', alignItems:'center', gap: 16, marginTop: 26}}>
            <div style={{display:'flex', gap: 6, flexWrap:'wrap'}}>
              <SrcChip items={['INSEE','EUROSTAT','DREES','OXFAM','CEVIPOF']} />
            </div>
          </div>

          <div style={{display:'flex', alignItems:'center', gap: 22, marginTop: 22, paddingTop: 22, borderTop:'1px solid var(--line)'}}>
            <div style={{display:'flex', alignItems:'center', gap: 10}}>
              <div style={{width:28, height:28, borderRadius:'50%', background:'var(--ink-3)', border:'1px solid var(--line-2)'}} />
              <div>
                <div className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--fg-mute)'}}>PAR</div>
                <div style={{fontFamily:'var(--serif)', fontSize: 14, fontStyle:'italic'}}>La rédaction · C. Voisin, M. Kebir</div>
              </div>
            </div>
            <span style={{flex:1}} />
            <ReadLink>LIRE LE DOSSIER</ReadLink>
          </div>
        </div>

        {/* Right: interactive viz stacked */}
        <aside style={{
          border:'1px solid var(--line)',
          padding:'16px 18px 18px',
          background:'var(--ink-1)',
          display:'flex', flexDirection:'column', gap: 16,
        }}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <span className="mono eyebrow" style={{fontSize:'var(--fs-mono-xs)'}}>VISUALISATION LIÉE</span>
            <span className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--fg-dim)'}}>FIG. 1/7</span>
          </div>
          <div style={{fontFamily:'var(--serif)', fontSize: 16, lineHeight:1.35}}>
            Pauvreté monétaire par département, 2017→2024
          </div>
          <Choropleth width={320} height={230} cellSize={18}/>
          <div style={{display:'flex', alignItems:'center', gap: 10, fontFamily:'var(--mono)', fontSize: 9.5, color:'var(--fg-mute)', letterSpacing:'.08em'}}>
            <span>+1,2 M</span>
            <div style={{flex:1, height: 6, background:'linear-gradient(90deg, oklch(0.70 0.08 215 / 0.75), oklch(0.40 0.07 215 / 0.5), var(--ink-2), oklch(0.55 0.12 27 / 0.65), oklch(0.70 0.17 27 / 0.9))'}} />
            <span>+14,8 %</span>
          </div>
          <hr className="hair"/>
          <SrcChip items={['INSEE 2017-2024']} />
        </aside>
      </section>

      {/* Secondary trio */}
      <section style={{
        padding:'0 40px 28px',
        display:'grid',
        gridTemplateColumns:'repeat(3, 1fr) 340px',
        gap: 28,
      }}>
        {[
          {
            eyebrow:'ENQUÊTE', kicker:'CONCENTRATION',
            title:'Concentration des médias : neuf milliardaires, 80 % du paysage',
            deck:'Cartographie des dix principaux groupes de médias privés, de leurs filiales et de leurs liens politiques. Données ARCOM croisées avec HATVP et AGORA.',
            src:['ARCOM','HATVP','AGORA'],
            date:'AVRIL 2026',
            spark: [3,4,3,5,7,6,8,9,10,12,14,16],
          },
          {
            eyebrow:'INVESTIGATION', kicker:'FINANCEMENT',
            title:'Financement politique : 66 M€ d’aide publique, qui en bénéficie ?',
            deck:'Suivi du financement des partis — aide publique, performance électorale, évolution depuis 2021. Décryptage des dépenses de campagne des législatives 2024.',
            src:['CNCCFP','MIN. INTÉRIEUR'],
            date:'MARS 2026',
            spark: [2,3,2,4,3,4,3,5,4,6,5,7],
          },
          {
            eyebrow:'TERRITOIRES', kicker:'FRACTURES',
            title:'Carte des 101 départements : cinq indicateurs de fracture',
            deck:'Revenus, emploi, démographie, logement, éducation. Choropleth interactif sur les données INSEE 2022–2024 croisées, avec surcouche électorale 2024.',
            src:['INSEE','MIN. INT.'],
            date:'FÉVRIER 2026',
            spark: [8,7,9,6,7,5,6,4,5,3,4,3],
          },
        ].map((a, i) => (
          <article key={i} style={{
            borderTop:'1px solid var(--line-2)',
            paddingTop: 16,
            display:'flex', flexDirection:'column', gap: 12,
          }}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <span className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--red)', letterSpacing:'.14em'}}>{a.eyebrow}</span>
              <span className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--fg-dim)'}}>{a.date}</span>
            </div>
            <h2 className="hd" style={{fontSize: 24, lineHeight: 1.15, margin: 0, letterSpacing:'-0.01em'}}>
              {a.title}
            </h2>
            <p style={{color:'var(--fg-mute)', fontSize: 14.5, lineHeight: 1.5, margin: 0, textWrap:'pretty'}}>
              {a.deck}
            </p>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginTop: 4}}>
              <Spark data={a.spark} width={90} height={22} color="var(--fg-mute)" />
              <ReadLink>LIRE LE DOSSIER</ReadLink>
            </div>
            <SrcChip items={a.src} />
          </article>
        ))}

        {/* Rail aligned right */}
        <div style={{gridRow:'1', gridColumn:'4'}}>
          <SignalsRail items={SIGNALS.slice(0,5)} />
        </div>
      </section>

      {/* Interactive strip */}
      <section style={{padding:'0 40px 32px'}}>
        <div style={{
          border:'1px solid var(--line)',
          background:'var(--ink-1)',
          padding:'22px 24px',
          display:'grid',
          gridTemplateColumns:'1fr auto',
          gap: 28,
          alignItems:'center',
        }}>
          <div>
            <div style={{display:'flex', alignItems:'center', gap: 10, marginBottom: 10}}>
              <svg width="14" height="14" viewBox="0 0 16 16"><rect x="2" y="10" width="2.5" height="4" fill="var(--red)"/><rect x="6" y="6" width="2.5" height="8" fill="var(--red-soft)"/><rect x="10" y="3" width="2.5" height="11" fill="var(--fg-mute)"/></svg>
              <span className="mono eyebrow" style={{fontSize:'var(--fs-mono-xs)'}}>ANALYSE INTERACTIVE</span>
            </div>
            <div style={{fontFamily:'var(--serif)', fontSize: 28, letterSpacing:'-0.01em', lineHeight:1.15}}>
              Réseau de lobbying : <em>1 289 actions</em> ciblant l’Élysée depuis 2022
            </div>
            <div style={{color:'var(--fg-mute)', fontSize: 14, marginTop: 8, maxWidth: 680}}>
              Graphe orienté des interactions déclarées entre organismes enregistrés HATVP et membres du cabinet présidentiel.
              Cliquez un nœud pour en voir les dossiers associés.
            </div>
          </div>
          <a href="#" style={{
            padding:'14px 20px',
            border:'1px solid var(--fg)',
            color:'var(--fg)',
            fontFamily:'var(--mono)',
            fontSize:'var(--fs-mono-sm)',
            letterSpacing:'.12em',
            textTransform:'uppercase',
            textDecoration:'none',
            whiteSpace:'nowrap',
          }}>
            EXPLORER LE GRAPHE →
          </a>
        </div>
      </section>

      {/* Footnotes band */}
      <section style={{padding:'0 40px 28px'}}>
        <div style={{display:'grid', gridTemplateColumns:'180px 1fr', gap: 28, paddingTop: 20, borderTop:'1px solid var(--line)'}}>
          <div className="mono eyebrow" style={{fontSize:'var(--fs-mono-xs)'}}>NOTES MÉTHODOLOGIQUES</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 28, color:'var(--fg-mute)', fontSize: 12.5, lineHeight: 1.55}}>
            <div>
              <span className="mono" style={{color:'var(--red)', fontSize: 10}}>[1]</span>{' '}
              Seuil à 60 % du revenu médian. INSEE, enquête revenus fiscaux et sociaux (ERFS), 2017–2024. Données consolidées, écart-type ±0,4 pt.
            </div>
            <div>
              <span className="mono" style={{color:'var(--red)', fontSize: 10}}>[2]</span>{' '}
              Patrimoine des 42 milliardaires français. Forbes + Oxfam, rapport « Inégalités extrêmes », 2025. Conversion en € constants 2024.
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

window.VariantA = VariantA;
