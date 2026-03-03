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
