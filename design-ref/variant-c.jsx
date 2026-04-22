// Variant C — Bureau
// Highest-density direction. Intelligence briefing DNA:
// - two-line top chrome with search mid, classification markers
// - three-column front page (hero + dossiers | viz column | rail)
// - HATVP declarations timeline strip
// - bar-rows breakdown of lobbying pressure
// - index panel + data health strip

const VariantC = () => {
  const W = 1440;
  return (
    <div className="obs-artboard obs-grain" style={{width: W}}>

      {/* Classification bar */}
      <div style={{
        display:'grid', gridTemplateColumns:'auto 1fr auto',
        padding:'6px 40px',
        background:'var(--ink-1)',
        borderBottom:'1px solid var(--line)',
        fontFamily:'var(--mono)', fontSize:'var(--fs-mono-xs)',
        color:'var(--fg-mute)', letterSpacing:'.14em',
      }}>
        <span>OPEN SOURCE · VÉRIFIABLE · HORODATÉ</span>
        <span style={{textAlign:'center', color:'var(--red)'}}>◆ BUREAU DES DONNÉES PUBLIQUES · ÉDITION 247 ◆</span>
        <span>RÉV. 2026-04-22 / 14:32Z</span>
      </div>

      <TopBar compact />

      {/* Section header row */}
      <div style={{
        display:'grid', gridTemplateColumns:'1fr auto 1fr',
        alignItems:'center', gap: 24,
        padding:'12px 40px',
        borderBottom:'1px solid var(--line)',
      }}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <span className="pulse"/>
          <span className="mono eyebrow--red" style={{fontSize:'var(--fs-mono-sm)'}}>BRIEFING DU MATIN</span>
          <span className="mono" style={{color:'var(--fg-dim)', fontSize:'var(--fs-mono-xs)'}}>//</span>
          <span className="mono" style={{color:'var(--fg-mute)', fontSize:'var(--fs-mono-xs)'}}>MERCREDI 22 AVRIL 2026</span>
        </div>
        <div className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--fg-mute)'}}>
          <span style={{color:'var(--red)'}}>●</span>{' '}<span style={{color:'var(--fg)'}}>18 signaux critiques</span>{' '}·{' '}
          <span style={{color:'var(--fg)'}}>197 ouverts</span>{' '}·{' '}
          <span style={{color:'var(--fg)'}}>12 clos 7j</span>
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', gap: 14, fontFamily:'var(--mono)', fontSize:'var(--fs-mono-xs)', color:'var(--fg-mute)'}}>
          {['TOUT','DOSSIERS','SIGNAUX','VOTES','ANNUAIRE','TERR.'].map((t,i)=>(
            <span key={t} style={{color: i===1?'var(--fg)':'var(--fg-mute)', borderBottom: i===1?'1px solid var(--red)':'none', paddingBottom:2}}>{t}</span>
          ))}
        </div>
      </div>

      {/* Three columns */}
      <section style={{
        display:'grid',
        gridTemplateColumns:'1.4fr 1fr 320px',
        gap: 24,
        padding:'28px 40px 24px',
      }}>
        {/* Col 1 — lead + dossiers */}
        <div style={{display:'flex', flexDirection:'column', gap: 24}}>
          <div>
            <div style={{display:'flex', gap: 10, alignItems:'center', marginBottom: 16}}>
              <span className="mono eyebrow--red" style={{fontSize:'var(--fs-mono-sm)'}}>◆ DOSSIER DE UNE</span>
              <span className="mono" style={{color:'var(--fg-dim)', fontSize:'var(--fs-mono-xs)'}}>//</span>
              <span className="mono" style={{color:'var(--fg-mute)', fontSize:'var(--fs-mono-xs)'}}>DOS-12-2026 · LECT. 18 MIN</span>
              <span className="mono" style={{color:'var(--fg-dim)', fontSize:'var(--fs-mono-xs)'}}>//</span>
              <span className="mono sig-tag sig-tag--verified" style={{fontSize: 9.5}}>VÉRIFIÉ · 47 SRC</span>
            </div>
            <h1 className="hd" style={{fontSize: 46, lineHeight: 1.04, margin: 0, letterSpacing:'-0.018em'}}>
              Bilan Macron : <em>neuf ans,</em> sept fractures.
              Ce que 800 000 lignes de données révèlent.
            </h1>
            <p style={{fontFamily:'var(--serif)', fontSize: 16, lineHeight: 1.5, color:'var(--fg)', marginTop: 16, textWrap:'pretty'}}>
              Économie, santé, droits, environnement, élites, cohésion, climat politique. Plus d’un million de personnes basculent
              sous le seuil de pauvreté<Footnote n="1"/> pendant que les milliardaires doublent leur fortune<Footnote n="2"/>.
              Le Bureau publie le jeu de données source pour chacune des 47 mesures.
            </p>
            <div style={{display:'flex', gap: 8, flexWrap:'wrap', marginTop: 14}}>
              <SrcChip items={['INSEE','EUROSTAT','DREES','OXFAM','CEVIPOF','BCE','OFCE']} />
            </div>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginTop: 16}}>
              <div className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--fg-mute)'}}>
                PAR LA RÉDACTION · C. VOISIN, M. KEBIR — MISE À JOUR 22.04.2026
              </div>
              <ReadLink>OUVRIR LE DOSSIER</ReadLink>
            </div>
          </div>

          <hr className="hair"/>

          {/* Lobbying bar rows */}
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 14}}>
              <span className="mono eyebrow" style={{fontSize:'var(--fs-mono-xs)'}}>ACTIONS DE LOBBYING — TOP 6 CIBLES</span>
              <span className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--fg-dim)'}}>AGORA 2022-2026</span>
            </div>
            <BarRows items={[
              {label:'PRÉSIDENT RÉP.', v: 1289, display:'1 289', color:'var(--red)'},
              {label:'MIN. ÉCONOMIE',   v: 942,  display:'942',   color:'var(--red)'},
              {label:'MIN. TRANSITION', v: 781,  display:'781',   color:'oklch(0.62 0.15 27 / 0.85)'},
              {label:'COMM. FINANCES',  v: 518,  display:'518',   color:'oklch(0.55 0.12 27 / 0.75)'},
              {label:'MIN. SANTÉ',      v: 422,  display:'422',   color:'oklch(0.48 0.10 27 / 0.65)'},
              {label:'MIN. INTÉRIEUR',  v: 310,  display:'310',   color:'oklch(0.42 0.08 27 / 0.55)'},
            ]} barH={12} width={400}/>
          </div>

          <hr className="hair"/>

          {/* Two dossier cards side-by-side */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 24}}>
            {[
              {
                eyebrow:'MÉDIAS · CONCENTRATION', title:'Neuf milliardaires, 80 % du paysage',
                deck:'Dix groupes dominants croisés entre ARCOM, HATVP, AGORA. Indice HHI 0,78.',
                src:['ARCOM','HATVP','AGORA'], date:'04/26',
              },
              {
                eyebrow:'FINANCEMENT · PARTIS', title:'66 M€ d’aide publique, qui en bénéficie ?',
                deck:'Aide publique et dépenses de campagne 2021-2025. Trois formations captent 64 %.',
                src:['CNCCFP','MIN. INT.'], date:'03/26',
              },
            ].map((a,i)=>(
              <article key={i} style={{display:'flex', flexDirection:'column', gap: 10}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--red)', letterSpacing:'.14em'}}>{a.eyebrow}</span>
                  <span className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--fg-dim)'}}>{a.date}</span>
                </div>
                <h3 className="hd" style={{fontSize: 22, lineHeight: 1.14, margin: 0, letterSpacing:'-0.01em'}}>{a.title}</h3>
                <p style={{color:'var(--fg-mute)', fontSize: 13.5, lineHeight: 1.5, margin: 0, textWrap:'pretty'}}>{a.deck}</p>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <SrcChip items={a.src}/>
                  <ReadLink/>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Col 2 — viz column */}
        <div style={{display:'flex', flexDirection:'column', gap: 20}}>
          {/* Choropleth */}
          <figure style={{margin: 0, border:'1px solid var(--line)', background:'var(--ink-1)', padding: 14}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10}}>
              <span className="mono eyebrow" style={{fontSize:'var(--fs-mono-xs)'}}>TERRITOIRE — PAUVRETÉ 2024</span>
              <span className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--fg-dim)'}}>FIG. 1</span>
            </div>
            <div style={{background:'var(--ink-0)', border:'1px solid var(--line)', padding: '6px 0'}}>
              <Choropleth width={360} height={240} cellSize={20}/>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 10, fontFamily:'var(--mono)', fontSize: 9.5, color:'var(--fg-mute)'}}>
              <span>− 8,0 %</span>
              <div style={{flex:1, height: 6, margin:'0 10px', background:'linear-gradient(90deg, oklch(0.70 0.08 215 / 0.75), var(--ink-2), oklch(0.70 0.17 27 / 0.9))'}}/>
              <span>+ 22,6 %</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 8}}>
              <SrcChip items={['INSEE 2024']}/>
              <a href="#" className="lnk-arrow">CARTE →</a>
            </div>
          </figure>

          {/* Timeline */}
          <figure style={{margin: 0, border:'1px solid var(--line)', background:'var(--ink-1)', padding: 14}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10}}>
              <span className="mono eyebrow" style={{fontSize:'var(--fs-mono-xs)'}}>DÉCLARATIONS HATVP — 2017→2026</span>
              <span className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--red)'}}>23 ANOMALIES</span>
            </div>
            <div style={{background:'var(--ink-0)', border:'1px solid var(--line)'}}>
              <TimelineDots width={360} height={100} />
            </div>
            <div style={{display:'flex', alignItems:'center', gap: 16, marginTop: 8, fontFamily:'var(--mono)', fontSize: 9.5, color:'var(--fg-mute)'}}>
              <span><span style={{display:'inline-block',width:6,height:6,background:'var(--fg-mute)',borderRadius:'50%',marginRight:5}}/>CONFORME</span>
              <span><span style={{display:'inline-block',width:8,height:8,background:'var(--red)',borderRadius:'50%',marginRight:5}}/>ÉCART DÉTECTÉ</span>
            </div>
          </figure>

          {/* Index panel */}
          <div style={{border:'1px solid var(--line)', background:'var(--ink-1)', padding: 14}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12}}>
              <span className="mono eyebrow" style={{fontSize:'var(--fs-mono-xs)'}}>INDICES DU JOUR</span>
              <span className="mono" style={{fontSize:'var(--fs-mono-xs)', color:'var(--fg-dim)'}}>BASE 100 = 2017</span>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16}}>
              {[
                {k:'POUVOIR D’ACHAT', v:'97.4', d:'-2.6', neg:true, spark:[100,99,98,97,96,97,98,97,97,98,97,97.4]},
                {k:'PAUVRETÉ',        v:'114.8', d:'+14.8', neg:true, spark:[100,101,103,104,106,108,109,110,112,113,114,114.8]},
                {k:'CONFIANCE INST.', v:'62.1', d:'-37.9', neg:true, spark:[100,94,88,82,77,74,72,70,68,66,64,62.1]},
                {k:'PATR. MILL.',     v:'214.2', d:'+114.2', neg:false, spark:[100,110,122,130,145,160,175,185,195,205,210,214.2]},
              ].map((x,i) => (
                <div key={i} style={{display:'flex', flexDirection:'column', gap: 5}}>
                  <span className="mono" style={{fontSize: 9.5, color:'var(--fg-mute)', letterSpacing:'.1em'}}>{x.k}</span>
                  <div style={{display:'flex', alignItems:'baseline', gap: 8}}>
                    <span style={{fontFamily:'var(--serif)', fontSize: 24, fontVariantNumeric:'tabular-nums'}}>{x.v}</span>
                    <span className="mono" style={{fontSize: 10, color: x.neg?'var(--red)':'oklch(0.75 0.1 150)'}}>{x.d}</span>
                  </div>
                  <Spark data={x.spark} width={140} height={22} color={x.neg?'var(--red)':'oklch(0.75 0.1 150)'}/>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col 3 — rail */}
        <div>
          <SignalsRail items={SIGNALS.slice(0,6)} compact />
        </div>
      </section>

      {/* Data health strip */}
      <section style={{padding:'0 40px 28px'}}>
        <div style={{
          border:'1px solid var(--line)', background:'var(--ink-1)',
          display:'grid', gridTemplateColumns:'repeat(6, 1fr)',
          fontFamily:'var(--mono)', fontSize:'var(--fs-mono-xs)', color:'var(--fg-mute)',
        }}>
          {[
            ['HATVP', 'OK · 18:12', '+12'],
            ['AGORA', 'OK · 12:44', '+2 311'],
            ['ASSEMBLÉE', 'OK · 09:10', '+8'],
            ['CNCCFP', 'Q1 PUBL.', '—'],
            ['ARCOM', 'OK · 06:02', 'idx 0.78'],
            ['INSEE', 'OK · 02:30', '14.8 %'],
          ].map(([k,s,v], i) => (
            <div key={k} style={{
              padding:'14px 16px',
              borderLeft: i===0 ? 'none' : '1px solid var(--line)',
              display:'flex', flexDirection:'column', gap: 6,
            }}>
              <div style={{display:'flex', alignItems:'center', gap: 8}}>
                <span style={{width:6, height:6, borderRadius:'50%', background: 'oklch(0.72 0.12 150)'}}/>
                <span style={{color:'var(--fg)', letterSpacing:'.1em'}}>{k}</span>
              </div>
              <div>{s}</div>
              <div style={{color:'var(--fg)'}}>{v}</div>
            </div>
          ))}
        </div>
      </section>

      <Footer/>
    </div>
  );
};

window.VariantC = VariantC;
