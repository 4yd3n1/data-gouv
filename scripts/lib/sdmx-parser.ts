/**
 * SDMX XML parser for INSEE BDM API responses.
 * Parses StructureSpecific format where data lives in element attributes.
 *
 * Usage:
 *   const xml = await fetchText("https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/001565137")
 *   const dataset = parseSdmxResponse(xml)
 */

import { XMLParser } from "fast-xml-parser";

export interface SdmxObs {
  timePeriod: string; // "2024-Q3", "2025-01"
  obsValue: number | null;
  obsStatus?: string; // "A" (normal), "P" (provisional)
}

export interface SdmxSeries {
  dimensions: Record<string, string>; // FREQ, INDICATEUR, SEXE, REF_AREA, etc.
  observations: SdmxObs[];
}

export interface SdmxDataset {
  series: SdmxSeries[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  isArray: (name) => name === "Series" || name === "Obs",
});

/**
 * Parse an SDMX XML response from INSEE BDM into typed objects.
 */
export function parseSdmxResponse(xml: string): SdmxDataset {
  const parsed = parser.parse(xml);

  // Navigate to the DataSet — structure varies slightly between responses
  const messageBody =
    parsed["message:StructureSpecificData"] ??
    parsed["StructureSpecificData"] ??
    parsed;
  const dataSet =
    messageBody?.["message:DataSet"] ??
    messageBody?.["DataSet"] ??
    messageBody?.["data:DataSet"];

  if (!dataSet) {
    // Try generic approach: find any key containing "DataSet"
    const key = Object.keys(messageBody ?? {}).find((k) =>
      k.toLowerCase().includes("dataset")
    );
    if (!key) {
      return { series: [] };
    }
    return parseDataSet(messageBody[key]);
  }

  return parseDataSet(dataSet);
}

function parseDataSet(dataSet: Record<string, unknown>): SdmxDataset {
  // Find Series elements — may be under "Series", "data:Series", etc.
  const seriesKey = Object.keys(dataSet).find((k) =>
    k.toLowerCase().includes("series")
  );

  if (!seriesKey) return { series: [] };

  let rawSeries = dataSet[seriesKey];
  if (!Array.isArray(rawSeries)) rawSeries = [rawSeries];

  const series: SdmxSeries[] = (rawSeries as Record<string, unknown>[]).map(
    (s) => {
      // Extract dimensions — all attributes on the Series element except internal ones
      const dimensions: Record<string, string> = {};
      for (const [key, val] of Object.entries(s)) {
        if (
          typeof val === "string" ||
          typeof val === "number"
        ) {
          dimensions[key] = String(val);
        }
      }

      // Find Obs elements
      const obsKey = Object.keys(s).find((k) =>
        k.toLowerCase().includes("obs")
      );
      let rawObs = obsKey ? s[obsKey] : [];
      if (!Array.isArray(rawObs)) rawObs = rawObs ? [rawObs] : [];

      const observations: SdmxObs[] = (rawObs as Record<string, unknown>[]).map(
        (o) => {
          const timePeriod =
            String(o["TIME_PERIOD"] ?? o["time_period"] ?? "");
          const rawValue = o["OBS_VALUE"] ?? o["obs_value"];
          const obsValue =
            rawValue === undefined || rawValue === null || rawValue === ""
              ? null
              : Number(rawValue);

          return {
            timePeriod,
            obsValue: obsValue !== null && isNaN(obsValue) ? null : obsValue,
            obsStatus: o["OBS_STATUS"]
              ? String(o["OBS_STATUS"])
              : undefined,
          };
        }
      );

      return { dimensions, observations };
    }
  );

  return { series };
}

/**
 * Convert a period string to a Date (start of period).
 * "2024" → 2024-01-01, "2024-Q3" → 2024-07-01, "2024-01" → 2024-01-01
 */
export function periodToDate(period: string): Date {
  // Quarterly: "2024-Q1" through "2024-Q4"
  const qMatch = period.match(/^(\d{4})-Q(\d)$/);
  if (qMatch) {
    const year = parseInt(qMatch[1]!);
    const quarter = parseInt(qMatch[2]!);
    const month = (quarter - 1) * 3; // Q1=0, Q2=3, Q3=6, Q4=9
    return new Date(year, month, 1);
  }

  // Monthly: "2024-01"
  const mMatch = period.match(/^(\d{4})-(\d{2})$/);
  if (mMatch) {
    return new Date(parseInt(mMatch[1]!), parseInt(mMatch[2]!) - 1, 1);
  }

  // Annual: "2024"
  const yMatch = period.match(/^(\d{4})$/);
  if (yMatch) {
    return new Date(parseInt(yMatch[1]!), 0, 1);
  }

  // Fallback
  return new Date(period);
}
