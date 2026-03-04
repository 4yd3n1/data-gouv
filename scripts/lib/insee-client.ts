/**
 * INSEE Mélodi API client.
 *
 * API: https://api.insee.fr/melodi (v1.13.1)
 * Replaces deprecated DDL API (https://api.insee.fr/donnees-locales/V0.1)
 * Auth: NONE — Mélodi "libre" plan is fully anonymous, no API key required.
 * Rate limit: 30 requests/minute
 *
 * Datasets:
 *   DS_FILOSOFI_CC         Median income, poverty rate, D1/D9 deciles (FILOSOFI 2021)
 *   DS_RP_POPULATION_PRINC Population by age/sex (Recensement 2022)
 *   DS_RP_EMPLOI_LR_PRINC  Active population & employment (Recensement 2022)
 */

const INSEE_BASE = "https://api.insee.fr/melodi";

// Rate limiter: 30 req/min → 2100ms between requests
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 2100;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();

  return fetch(url, {
    headers: { Accept: "text/csv" },
  });
}

async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await rateLimitedFetch(url);

      if (res.status === 429) {
        console.warn(`  [INSEE] Rate limited, waiting 10s... (attempt ${attempt})`);
        await new Promise((r) => setTimeout(r, 10000));
        continue;
      }

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`INSEE Mélodi ${res.status}: ${body.slice(0, 200)}`);
      }

      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`  [INSEE] Attempt ${attempt} failed, retrying in 5s...`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  throw new Error("Exhausted retries");
}

/** Parse semicolon-delimited CSV with quoted fields, BOM-safe */
function parseCsv(text: string): Record<string, string>[] {
  const clean = text.startsWith("\uFEFF") ? text.slice(1) : text;
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(";").map((h) => h.replace(/^"|"$/g, ""));

  return lines.slice(1).map((line) => {
    const values = line.split(";").map((v) => v.replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
}

// ─── Data Structures ───

export interface InseeLocalValue {
  geoType: string;   // "DEP", "COM", "REG"
  geoCode: string;   // "75", "75056"
  indicateur: string;
  annee: number;
  valeur: number;
  unite: string;
  source: string;    // "FILOSOFI", "RP"
}

// ─── FILOSOFI: Median income, poverty rate, deciles ───
// Dataset: DS_FILOSOFI_CC (FILOSOFI 2021, latest available)

export async function fetchFilosofiDep(
  depCode: string
): Promise<InseeLocalValue[]> {
  const url = `${INSEE_BASE}/data/DS_FILOSOFI_CC/to-csv?GEO=DEP-${depCode}`;

  try {
    const text = await fetchWithRetry(url);
    const rows = parseCsv(text);
    const results: InseeLocalValue[] = [];

    const indicateurMap: Record<string, { name: string; unite: string }> = {
      "MED_SL":      { name: "MEDIAN_INCOME",    unite: "EUR" },
      "PR_MD60":     { name: "POVERTY_RATE",      unite: "%" },
      "D1_SL":       { name: "INCOME_D1",         unite: "EUR" },
      "D9_SL":       { name: "INCOME_D9",         unite: "EUR" },
      "IR_D9_D1_SL": { name: "INCOME_RATIO_D9D1", unite: "ratio" },
    };

    for (const row of rows) {
      if (row["GEO_OBJECT"] !== "DEP") continue;
      const mapped = indicateurMap[row["FILOSOFI_MEASURE"]];
      if (!mapped) continue;

      const valStr = row["OBS_VALUE"];
      if (!valStr || valStr === "s" || valStr === "nd") continue;
      const valeur = parseFloat(valStr.replace(",", "."));
      if (isNaN(valeur)) continue;

      const annee = parseInt(row["TIME_PERIOD"], 10);
      if (isNaN(annee)) continue;

      results.push({
        geoType: "DEP",
        geoCode: row["GEO"],
        indicateur: mapped.name,
        annee,
        valeur,
        unite: mapped.unite,
        source: "FILOSOFI",
      });
    }

    return results;
  } catch (err) {
    console.warn(`  [INSEE] FILOSOFI fetch failed for DEP ${depCode}: ${err}`);
    return [];
  }
}

// ─── Recensement: Population by age ───
// Dataset: DS_RP_POPULATION_PRINC (Recensement 2022)

export async function fetchPopulationDep(
  depCode: string
): Promise<InseeLocalValue[]> {
  const url = `${INSEE_BASE}/data/DS_RP_POPULATION_PRINC/to-csv?GEO=DEP-${depCode}&SEX=_T&TIME_PERIOD=2022`;

  try {
    const text = await fetchWithRetry(url);
    const rows = parseCsv(text);
    const results: InseeLocalValue[] = [];

    // AGE codes available at département level
    const ageMap: Record<string, string> = {
      "_T":     "POP_TOTAL",
      "Y_GE65": "POP_65PLUS",
      "Y_LT20": "POP_0019",
      "Y20T64": "POP_1564",   // 20-64 as proxy for 15-64
    };

    for (const row of rows) {
      if (row["GEO_OBJECT"] !== "DEP") continue;
      if (row["RP_MEASURE"] !== "POP") continue;
      const indicateur = ageMap[row["AGE"]];
      if (!indicateur) continue;

      const valStr = row["OBS_VALUE"];
      if (!valStr) continue;
      const valeur = parseFloat(valStr);
      if (isNaN(valeur)) continue;

      const annee = parseInt(row["TIME_PERIOD"], 10);
      if (isNaN(annee)) continue;

      results.push({
        geoType: "DEP",
        geoCode: row["GEO"],
        indicateur,
        annee,
        valeur: Math.round(valeur),
        unite: "NB",
        source: "RP",
      });
    }

    return results;
  } catch (err) {
    console.warn(`  [INSEE] Population fetch failed for DEP ${depCode}: ${err}`);
    return [];
  }
}

// ─── Housing stock per département ───
// Dataset: DS_RP_LOGEMENT_PRINC (Recensement 2022)
// OCS codes: _T=total | DW_MAIN=main residences | DW_VAC=vacant | DW_SEC_DW_OCC=secondary
// Computes vacancy rate and secondary homes rate from dwelling counts.

export async function fetchLogementDep(
  depCode: string
): Promise<InseeLocalValue[]> {
  const url = `${INSEE_BASE}/data/DS_RP_LOGEMENT_PRINC/to-csv?GEO=DEP-${depCode}&TIME_PERIOD=2022&L_STAY=_T&TDW=_T&NRG_SRC=_T&CARS=_T&CARPARK=_T&NOR=_T&TSH=_T&BUILD_END=_T&RP_MEASURE=DWELLINGS`;

  try {
    const text = await fetchWithRetry(url);
    const rows = parseCsv(text);

    let total = 0;
    let vacant = 0;
    let secondary = 0;
    let annee = 2022;

    for (const row of rows) {
      if (row["GEO_OBJECT"] !== "DEP") continue;
      if (row["RP_MEASURE"] !== "DWELLINGS") continue;
      const val = parseFloat(row["OBS_VALUE"]?.replace(",", ".") ?? "");
      if (isNaN(val)) continue;
      annee = parseInt(row["TIME_PERIOD"], 10) || 2022;

      switch (row["OCS"]) {
        case "_T":           total     = val; break;
        case "DW_VAC":       vacant    = val; break;
        case "DW_SEC_DW_OCC": secondary = val; break;
      }
    }

    const results: InseeLocalValue[] = [];
    const geoCode = depCode;

    if (total > 0) {
      results.push({
        geoType: "DEP", geoCode, indicateur: "HOUSING_TOTAL",
        annee, valeur: Math.round(total), unite: "NB", source: "RP",
      });
      results.push({
        geoType: "DEP", geoCode, indicateur: "HOUSING_VACANCY_RATE",
        annee, valeur: Math.round((vacant / total) * 1000) / 10,
        unite: "%", source: "RP",
      });
      results.push({
        geoType: "DEP", geoCode, indicateur: "HOUSING_SECONDARY_RATE",
        annee, valeur: Math.round((secondary / total) * 1000) / 10,
        unite: "%", source: "RP",
      });
    }

    return results;
  } catch (err) {
    console.warn(`  [INSEE] Logement fetch failed for DEP ${depCode}: ${err}`);
    return [];
  }
}

// ─── Education levels per département ───
// Dataset: DS_RP_DIPLOMES_PRINC (Recensement 2022)
// Population 15+ broken down by highest diploma level.
// EDUC dimension codes (RP nomenclature):
//   _T          = total (all levels)
//   001T100_RP  = no diploma / CEP (Certificat d'études primaires)
//   200_RP      = BEPC/Brevet (lower secondary)
//   300_RP      = CAP/BEP (vocational)
//   350T351_RP  = baccalauréat (général, techno, professionnel)
//   500_RP      = bac+2 (BTS, DUT, DEUG)
//   600_RP      = bac+3 to bac+4 (licence, maîtrise)
//   700_RP      = bac+5 and above (master, grande école, doctorat)

export async function fetchEducationDep(
  depCode: string
): Promise<InseeLocalValue[]> {
  // Dataset: DS_RP_DIPLOMES_PRINC (Recensement 2022)
  // Dimension: EDUC — RP nomenclature codes (e.g. 001T100_RP, 350T351_RP, 500_RP…)
  const url = `${INSEE_BASE}/data/DS_RP_DIPLOMES_PRINC/to-csv?GEO=DEP-${depCode}&SEX=_T&AGE=Y_GE15&TIME_PERIOD=2022`;

  try {
    const text = await fetchWithRetry(url);
    const rows = parseCsv(text);

    // Accumulate population counts by diploma level
    const counts: Record<string, number> = {};
    let annee = 2022;

    for (const row of rows) {
      if (row["GEO_OBJECT"] !== "DEP") continue;
      if (row["RP_MEASURE"] && row["RP_MEASURE"] !== "POP") continue;
      const val = parseFloat(row["OBS_VALUE"]?.replace(",", ".") ?? "");
      if (isNaN(val)) continue;
      annee = parseInt(row["TIME_PERIOD"], 10) || 2022;

      const educLevel = row["EDUC"] ?? "";
      counts[educLevel] = (counts[educLevel] ?? 0) + val;
    }

    const total = counts["_T"] ?? 0;
    if (total === 0) {
      const available = Object.keys(counts).filter((k) => k !== "").join(", ");
      if (available) {
        console.warn(
          `  [INSEE] Education DEP ${depCode}: no _T total found. Available EDUC codes: [${available}]`
        );
      }
      return [];
    }

    // No diploma: 001T100_RP (no diploma + CEP primary cert)
    const noDiploma = counts["001T100_RP"] ?? 0;

    // Bac or higher: 350T351_RP (bac) + 500_RP (bac+2) + 600_RP (bac+3/4) + 700_RP (bac+5+)
    const bacOrHigher =
      (counts["350T351_RP"] ?? 0) +
      (counts["500_RP"] ?? 0) +
      (counts["600_RP"] ?? 0) +
      (counts["700_RP"] ?? 0);

    // Higher education only: bac+2 and above
    const higherEduc =
      (counts["500_RP"] ?? 0) +
      (counts["600_RP"] ?? 0) +
      (counts["700_RP"] ?? 0);

    const results: InseeLocalValue[] = [];
    const geoCode = depCode;

    if (noDiploma > 0) {
      results.push({
        geoType: "DEP", geoCode, indicateur: "EDUC_NO_DIPLOMA",
        annee, valeur: Math.round((noDiploma / total) * 1000) / 10,
        unite: "%", source: "RP",
      });
    }
    if (bacOrHigher > 0) {
      results.push({
        geoType: "DEP", geoCode, indicateur: "EDUC_BAC_PLUS",
        annee, valeur: Math.round((bacOrHigher / total) * 1000) / 10,
        unite: "%", source: "RP",
      });
    }
    if (higherEduc > 0) {
      results.push({
        geoType: "DEP", geoCode, indicateur: "EDUC_HIGHER_EDUC",
        annee, valeur: Math.round((higherEduc / total) * 1000) / 10,
        unite: "%", source: "RP",
      });
    }

    if (results.length === 0 && total > 0) {
      const available = Object.keys(counts).filter((k) => k !== "_T" && k !== "").join(", ");
      console.warn(
        `  [INSEE] Education DEP ${depCode}: total=${Math.round(total)}, but no expected EDUC codes matched. Available: [${available}]`
      );
    }

    return results;
  } catch (err) {
    console.warn(`  [INSEE] Education fetch failed for DEP ${depCode}: ${err}`);
    return [];
  }
}

// ─── Employment rates per département ───
// Dataset: DS_RP_EMPLOI_LR_PRINC (Recensement 2022)
// Computes unemployment, activity, and employment rates from EMPSTA_ENQ counts.
// EMPSTA_ENQ=1: employed | =2: unemployed | =_T: total pop 15-64 (incl. inactive)

export async function fetchEmploiDep(
  depCode: string
): Promise<InseeLocalValue[]> {
  const url = `${INSEE_BASE}/data/DS_RP_EMPLOI_LR_PRINC/to-csv?GEO=DEP-${depCode}&SEX=_T&AGE=Y15T64&EDUC=_T&TIME_PERIOD=2022`;

  try {
    const text = await fetchWithRetry(url);
    const rows = parseCsv(text);

    let employed = 0;
    let unemployed = 0;
    let totalPop15T64 = 0;
    let annee = 2022;

    for (const row of rows) {
      if (row["GEO_OBJECT"] !== "DEP") continue;
      const val = parseFloat(row["OBS_VALUE"]);
      if (isNaN(val)) continue;
      annee = parseInt(row["TIME_PERIOD"], 10) || 2022;

      switch (row["EMPSTA_ENQ"]) {
        case "1":  employed      = val; break;
        case "2":  unemployed    = val; break;
        case "_T": totalPop15T64 = val; break;
      }
    }

    const results: InseeLocalValue[] = [];
    const geoCode = depCode;
    const activePop = employed + unemployed;

    if (activePop > 0) {
      results.push({
        geoType: "DEP", geoCode, indicateur: "UNEMPLOYMENT_RATE_LOCAL",
        annee, valeur: Math.round((unemployed / activePop) * 1000) / 10,
        unite: "%", source: "RP",
      });
    }
    if (totalPop15T64 > 0) {
      results.push({
        geoType: "DEP", geoCode, indicateur: "ACTIVITY_RATE",
        annee, valeur: Math.round((activePop / totalPop15T64) * 1000) / 10,
        unite: "%", source: "RP",
      });
      results.push({
        geoType: "DEP", geoCode, indicateur: "EMPLOYMENT_RATE",
        annee, valeur: Math.round((employed / totalPop15T64) * 1000) / 10,
        unite: "%", source: "RP",
      });
    }

    return results;
  } catch (err) {
    console.warn(`  [INSEE] Emploi fetch failed for DEP ${depCode}: ${err}`);
    return [];
  }
}
