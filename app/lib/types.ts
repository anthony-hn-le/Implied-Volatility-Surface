export interface SurfaceGrid {
  t: number[];
  k: number[];
  z: (number | null)[][];
}

export interface SurfaceResponse {
  ticker: string;
  spotPrice: number;
  dividendYield: number;
  riskFreeRate: number;
  yAxisLabel: string;
  grid: SurfaceGrid;
  warnings: string[];
}

export interface SurfaceErrorResponse {
  error: string;
}

export interface SurfaceParams {
  ticker: string;
  riskFreeRate: number;
  dividendYield: number;
  timeMin: number;
  timeMax: number;
  minStrikePct: number;
  maxStrikePct: number;
  yAxis: "strike" | "moneyness";
}
