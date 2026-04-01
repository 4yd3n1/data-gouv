import { CONTRAST_ROWS } from "@/data/bilan-macron";

const categoryLabel = {
  economie: "\u00C9conomie",
  social: "Social",
  fiscal: "Fiscalit\u00E9 & D\u00E9mocratie",
};

const categoryColor = {
  economie: "text-amber",
  social: "text-rose",
  fiscal: "text-blue",
};

export function BilanContrasteSection() {
  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-bureau-100 mb-1">
          Les deux Frances
        </h2>
        <p className="text-sm text-bureau-400">
          Pour chaque indicateur, la r&eacute;alit&eacute; v&eacute;cue par la population face &agrave;
          celle des &eacute;lites.
        </p>
      </div>

      {/* Headers */}
      <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_1fr] gap-4 px-4">
        <div />
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-rose text-center">
          La France d&rsquo;en bas
        </p>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal text-center">
          La France d&rsquo;en haut
        </p>
      </div>

      <div className="space-y-2">
        {CONTRAST_ROWS.map((row) => (
          <div
            key={row.label}
            className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr] gap-0">
              {/* Label */}
              <div className="px-4 py-3 border-b sm:border-b-0 sm:border-r border-bureau-700/10 flex items-center gap-2">
                <span
                  className={`text-[10px] uppercase tracking-wider ${categoryColor[row.category]}`}
                >
                  {categoryLabel[row.category]}
                </span>
                <span className="text-sm font-medium text-bureau-200">
                  {row.label}
                </span>
              </div>

              {/* People */}
              <div className="px-4 py-3 border-b sm:border-b-0 sm:border-r border-bureau-700/10 bg-rose/[0.03]">
                <p className="sm:hidden text-[10px] uppercase tracking-wider text-rose mb-1">
                  La France d&rsquo;en bas
                </p>
                <p className="text-xs text-bureau-300">{row.peuple}</p>
              </div>

              {/* Elite */}
              <div className="px-4 py-3 bg-teal/[0.03]">
                <p className="sm:hidden text-[10px] uppercase tracking-wider text-teal mb-1">
                  La France d&rsquo;en haut
                </p>
                <p className="text-xs text-bureau-300">{row.elite}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary callout */}
      <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/40 px-6 py-5">
        <p className="text-sm text-bureau-200">
          Sous la presidence Macron, la politique fiscale (suppression de
          l&rsquo;ISF, flat tax, baisse de l&rsquo;IS) a transfere un montant
          estime a{" "}
          <span className="font-semibold text-rose">250 milliards d&rsquo;euros</span>{" "}
          de capacit&eacute; fiscale vers les d&eacute;tenteurs de capital et les grandes
          entreprises.
        </p>
        <p className="mt-2 text-sm text-bureau-200">
          Dans le meme temps,{" "}
          <span className="font-semibold text-rose">
            1 million de personnes supplementaires
          </span>{" "}
          sont tomb&eacute;es sous le seuil de pauvret&eacute;, les sans-abri ont augment&eacute; de
          75 %, et les banques alimentaires servent 47 % de b&eacute;n&eacute;ficiaires en
          plus.
        </p>
        <p className="mt-3 text-xs text-bureau-500">
          Evaluation de la suppression de l&rsquo;ISF et du PFU par France
          Strategie (2023) : &laquo;&nbsp;aucun effet observable sur
          l&rsquo;economie&nbsp;&raquo;, &laquo;&nbsp;impact nul sur
          l&rsquo;investissement&nbsp;&raquo;.
        </p>
      </div>
    </section>
  );
}
