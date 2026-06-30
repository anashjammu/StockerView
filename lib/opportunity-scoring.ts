export type OpportunityVerdict = "Research Candidate" | "Watch" | "High Risk" | "Weak Setup" | "Avoid";

type OpportunityStockLike = {
  distanceFromHigh?: number;
  fcfTrend?: string;
  newsSentiment?: string;
  analystRevisionTrend?: string;
  riskLevel?: string;
  opportunityScore?: number;
  verdict?: OpportunityVerdict | "Needs Confirmation";
  whyDown?: string;
  recoveryPath?: string;
  keyCatalysts?: string[];
  majorRisks?: string[];
};

export type OpportunityScoreInput = {
  symbol: string;
  sector: string;
  revenueGrowth: number;
  epsGrowth: number;
  freeCashFlowTrend?: string;
  grossMargin?: number;
  distanceFromHigh?: number;
  relativeStrength?: number;
  newsSentiment?: string;
  sectorTailwind?: string;
  earningsMomentum?: string;
  valuation?: string;
  balanceSheetRisk?: string;
  earningsDate?: string;
  catalysts?: string[];
  opportunity?: OpportunityStockLike;
};

export type OpportunityScoreResult = {
  score: number;
  verdict: OpportunityVerdict;
  drivers: string[];
  risks: string[];
  recoveryCatalysts: string[];
  whyDown: string[];
  catalystWatch: string[];
};

export function calculateOpportunityScore(tickerData: OpportunityScoreInput): OpportunityScoreResult {
  if (tickerData.sector === "Data unavailable" && tickerData.revenueGrowth === 0 && tickerData.epsGrowth === 0) {
    return {
      score: 0,
      verdict: "Avoid",
      drivers: ["Data unavailable"],
      whyDown: ["Data unavailable"],
      recoveryCatalysts: ["Data unavailable"],
      risks: ["Data unavailable"],
      catalystWatch: ["Data unavailable"]
    };
  }

  const opportunity = tickerData.opportunity;
  const distanceFromHigh = Math.abs(tickerData.distanceFromHigh ?? opportunity?.distanceFromHigh ?? 18);
  const revenueGrowth = tickerData.revenueGrowth;
  const epsGrowth = tickerData.epsGrowth;
  const fcfTrend = tickerData.freeCashFlowTrend ?? opportunity?.fcfTrend ?? "Stable";
  const newsSentiment = tickerData.newsSentiment ?? opportunity?.newsSentiment ?? "Neutral";
  const analystTrend = opportunity?.analystRevisionTrend ?? tickerData.earningsMomentum ?? "Neutral";

  let score = 45;
  score += Math.min(20, Math.max(0, revenueGrowth) * 0.22);
  score += Math.min(16, Math.max(-15, epsGrowth) * 0.16);
  score += fcfTrend === "Accelerating" ? 10 : fcfTrend === "Improving" ? 8 : fcfTrend === "Stable" ? 4 : fcfTrend === "Volatile" ? -2 : -7;
  score += distanceFromHigh >= 20 && distanceFromHigh <= 45 ? 8 : distanceFromHigh > 55 ? -5 : 2;
  score += newsSentiment === "Positive" ? 7 : newsSentiment === "Mixed" ? 1 : newsSentiment === "Negative" ? -8 : 3;
  score += analystTrend === "Positive" ? 8 : analystTrend === "Mixed" ? 1 : analystTrend === "Negative" ? -7 : 3;
  score += opportunity?.riskLevel === "Speculative" ? -12 : opportunity?.riskLevel === "High" ? -7 : opportunity?.riskLevel === "Low" ? 5 : 1;

  const roundedScore = Math.max(0, Math.min(100, Math.round(opportunity?.opportunityScore ?? score)));
  const verdict = normalizeVerdict(opportunity?.verdict, roundedScore);

  return {
    score: roundedScore,
    verdict,
    drivers: buildDrivers(tickerData, distanceFromHigh, fcfTrend, newsSentiment, analystTrend),
    whyDown: buildWhyDown(tickerData, distanceFromHigh),
    recoveryCatalysts: buildRecoveryCatalysts(tickerData),
    risks: buildRisks(tickerData),
    catalystWatch: buildCatalystWatch(tickerData)
  };
}

function normalizeVerdict(verdict: OpportunityStockLike["verdict"] | undefined, score: number): OpportunityVerdict {
  if (verdict === "Research Candidate") return "Research Candidate";
  if (verdict === "Watch" || verdict === "Needs Confirmation") return "Watch";
  if (verdict === "High Risk") return "High Risk";
  if (verdict === "Weak Setup") return "Weak Setup";
  if (score >= 82) return "Research Candidate";
  if (score >= 68) return "Watch";
  if (score >= 52) return "High Risk";
  if (score >= 38) return "Weak Setup";
  return "Avoid";
}

function buildDrivers(data: OpportunityScoreInput, distanceFromHigh: number, fcfTrend: string, newsSentiment: string, analystTrend: string) {
  if (data.sector === "Data unavailable" || (data.revenueGrowth === 0 && data.epsGrowth === 0 && newsSentiment === "Data unavailable")) {
    return ["Data unavailable"];
  }

  return [
    `${data.revenueGrowth}% revenue growth keeps the ticker on the research screen.`,
    `${data.epsGrowth}% EPS growth gives the setup earnings leverage if estimates hold.`,
    `${distanceFromHigh}% below the 52-week high creates a recovery screen, not a prediction.`,
    `${data.sector} exposure provides the main sector tailwind to monitor.`,
    `${fcfTrend} free cash flow trend, ${newsSentiment.toLowerCase()} news sentiment, and ${analystTrend.toLowerCase()} estimate direction shape the score.`
  ].slice(0, 5);
}

function buildWhyDown(data: OpportunityScoreInput, distanceFromHigh: number) {
  const opportunity = data.opportunity;

  if (opportunity?.whyDown) {
    return [
      opportunity.whyDown,
      "Valuation pressure can still matter if rates, earnings revisions, or sector appetite deteriorate."
    ];
  }

  return [
    `${data.symbol} is roughly ${distanceFromHigh}% below its 52-week high based on available provider data.`,
    "Valuation pressure and uneven sentiment may have weighed on the setup.",
    `${data.sector} group weakness or macro pressure could keep buyers selective.`
  ];
}

function buildRecoveryCatalysts(data: OpportunityScoreInput) {
  const opportunity = data.opportunity;

  return [
    opportunity?.recoveryPath ?? "Better earnings, firmer guidance, or cleaner margin trends could improve the research case.",
    ...(opportunity?.keyCatalysts ?? data.catalysts ?? ["Sector rebound", "Improving revenue growth", "Constructive news flow"])
  ].slice(0, 4);
}

function buildRisks(data: OpportunityScoreInput) {
  const opportunity = data.opportunity;

  return (
    opportunity?.majorRisks ?? [
      "Valuation risk if growth expectations reset lower.",
      "Competition and execution risk within the sector.",
      data.balanceSheetRisk ?? "Macro risk from rates, liquidity, and risk appetite."
    ]
  ).slice(0, 4);
}

function buildCatalystWatch(data: OpportunityScoreInput) {
  return [
    data.earningsDate ? `Earnings date: ${data.earningsDate}` : "Next earnings update",
    ...(data.catalysts ?? data.opportunity?.keyCatalysts ?? []),
    data.sector.includes("Semiconductor") || data.sector.includes("Software") ? "AI/data center demand updates" : "Sector news flow",
    "Fed, CPI, and PCE events that can affect valuation-sensitive assets"
  ].slice(0, 5);
}
