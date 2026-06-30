export type PricePoint = {
  label: string;
  value: number;
};

export type Ticker = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume: string;
  sector: string;
};

export type TickerStatus = "Research" | "Watch" | "Avoid";
export type TickerSentiment = "Positive" | "Neutral" | "Negative" | "Mixed";

export type TickerSignal = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  relativeVolume: string;
  rsi: number;
  earningsDate: string;
  newsSentiment: TickerSentiment;
  status: TickerStatus;
};

export type MarketIndex = {
  symbol: string;
  name: string;
  value: string;
  change: number;
};

export type BreadthRow = {
  label: string;
  value: number;
  color: string;
};

export type SectorChange = {
  sector: string;
  change: number;
  note?: string;
};

export type TechnicalIndicator = {
  label: string;
  value: string;
  signal: string;
};

export type FundamentalRow = {
  metric: string;
  value: string;
  context: string;
};

export type NewsRow = {
  time: string;
  headline: string;
  impact: string;
};

export type EarningsRow = {
  quarter: string;
  revenue: string;
  eps: string;
  surprise: string;
  guide: string;
};

export type AnalystRatingRow = {
  firm: string;
  rating: string;
  target: string;
  stance: string;
};

export type MacroTile = {
  label: string;
  value: string;
  change: number;
};

export type EconomicCalendarRow = {
  time: string;
  event: string;
  actual: string;
  consensus: string;
  impact: string;
};

export type MorningFutureRow = {
  symbol: string;
  name: string;
  value: string;
  change: number;
  detail: string;
};

export type MorningMoverRow = {
  symbol: string;
  name: string;
  move: number;
  driver: string;
};

export type MorningLevelRow = {
  market: string;
  support: string;
  pivot: string;
  resistance: string;
};

export type PortfolioHoldingRow = {
  symbol: string;
  weight: number;
  value: string;
  pnl: number;
  risk: string;
};

export type FactorExposureRow = {
  label: string;
  value: number;
};

export type OpportunityStock = {
  rank: number;
  ticker: string;
  company: string;
  sector: string;
  theme: "AI" | "Semiconductors" | "Cybersecurity" | "Quantum" | "Energy" | "Defense" | "Biotech" | "Space";
  currentPrice: number;
  marketCap: string;
  marketCapBucket: "Small Cap" | "Mid Cap" | "Large Cap";
  distanceFromHigh: number;
  revenueGrowth: number;
  epsGrowth: number;
  fcfTrend: "Accelerating" | "Improving" | "Stable" | "Volatile" | "Negative";
  analystRevisionTrend: "Positive" | "Neutral" | "Mixed" | "Negative";
  newsSentiment: "Positive" | "Neutral" | "Mixed" | "Negative";
  institutionalBuyingSignal: "Strong" | "Moderate" | "Early" | "Weak";
  opportunityScore: number;
  riskLevel: "Low" | "Medium" | "High" | "Speculative";
  verdict: "Research Candidate" | "Watch" | "Needs Confirmation" | "High Risk" | "Weak Setup";
  bullCase: string;
  bearCase: string;
  keyCatalysts: string[];
  majorRisks: string[];
  whyDown: string;
  recoveryPath: string;
  suggestedAction: "Research Candidate" | "Watch" | "Needs Confirmation" | "High Risk" | "Weak Setup";
};

export const marketIndices: MarketIndex[] = [];
export const marketBreadth: BreadthRow[] = [];
export const heatMap: SectorChange[] = [];
export const trackedTickers: Ticker[] = [];
export const trackedTickerSignals: TickerSignal[] = [];
export const intraday: PricePoint[] = [];
export const intradayByIndex: Record<string, PricePoint[]> = {};
export const indexChartTitles: Record<string, string> = {
  SPX: "S&P 500",
  NDX: "Nasdaq 100",
  DJI: "Dow Industrials",
  RUT: "Russell 2000"
};

export const stockProfile = {
  symbol: "",
  name: "Data unavailable",
  price: 0,
  change: 0,
  marketCap: "Data unavailable",
  pe: "Data unavailable",
  beta: "Data unavailable",
  yield: "Data unavailable",
  target: "Data unavailable",
  rating: "Data unavailable"
};

export const stockMetrics: Array<{ label: string; value: string; tone: "positive" | "neutral" | "negative" }> = [];
export const analystTargets: Array<{ label: string; value: number }> = [];
export const stockTechnicalIndicators: TechnicalIndicator[] = [];
export const stockFundamentals: FundamentalRow[] = [];
export const stockNews: NewsRow[] = [];
export const stockEarnings: EarningsRow[] = [];
export const stockAnalystRatings: AnalystRatingRow[] = [];
export const stockAiSummary = {
  bull: "Data unavailable",
  bear: "Data unavailable",
  verdict: "Data unavailable"
};
export const stockRiskScore = {
  score: 0,
  label: "Data unavailable",
  drivers: [] as string[]
};
export const stockEntryZone = {
  ideal: "Data unavailable",
  stretch: "Data unavailable",
  invalidation: "Data unavailable",
  note: "Data unavailable"
};
export const stockLongTermThesis: string[] = [];

export const macroTiles: MacroTile[] = [];
export const yieldCurve: PricePoint[] = [];
export const economicCalendar: EconomicCalendarRow[] = [];

export const morningIndexFutures: MorningFutureRow[] = [];
export const morningSectorStrength: SectorChange[] = [];
export const morningTopHeadlines: NewsRow[] = [];
export const morningMovers: MorningMoverRow[] = [];
export const morningKeyLevels: MorningLevelRow[] = [];
export const morningAiSummary = {
  tone: "Data unavailable",
  summary: "Market brief data unavailable. Connect a live data provider to populate this section.",
  watch: "Data unavailable"
};

export const portfolioHoldings: PortfolioHoldingRow[] = [];
export const portfolioEquity: PricePoint[] = [];
export const factorExposure: FactorExposureRow[] = [];
export const opportunityStocks: OpportunityStock[] = [];
