"use client";

import { useEffect, useState } from "react";
import ControlsPanel from "./components/ControlsPanel";
import StatTiles from "./components/StatTiles";
import SurfacePlot from "./components/SurfacePlot";
import LoadingSpinner from "./components/LoadingSpinner";
import { Footer } from "./components/Footer";
import type { SurfaceParams, SurfaceResponse } from "@/lib/types";

const DEFAULT_PARAMS: SurfaceParams = {
  ticker: "SPY",
  riskFreeRate: 0,
  dividendYield: 0,
  timeMin: 0.01,
  timeMax: 1.0,
  minStrikePct: 80,
  maxStrikePct: 120,
  yAxis: "strike",
};

interface RateOverrides {
  riskFreeRate: boolean;
  dividendYield: boolean;
}

function buildQuery(params: SurfaceParams, overrides: RateOverrides) {
  const query = new URLSearchParams({
    ticker: params.ticker,
    timeMin: String(params.timeMin),
    timeMax: String(params.timeMax),
    minStrikePct: String(params.minStrikePct),
    maxStrikePct: String(params.maxStrikePct),
    yAxis: params.yAxis,
  });
  if (overrides.riskFreeRate) query.set("riskFreeRate", String(params.riskFreeRate));
  if (overrides.dividendYield) query.set("dividendYield", String(params.dividendYield));
  return query.toString();
}

export default function HomePage() {
  const [params, setParams] = useState<SurfaceParams>(DEFAULT_PARAMS);
  const [data, setData] = useState<SurfaceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Whether the user has manually edited each field for the *current* ticker.
  // Risk-free rate is market-wide (not ticker-specific) so it stays sticky
  // across ticker changes; dividend yield is ticker-specific, so changing the
  // ticker clears this flag and lets the new ticker's real yield come back
  // from the API instead of carrying over the previous ticker's value.
  const [riskFreeRateTouched, setRiskFreeRateTouched] = useState(false);
  const [dividendYieldTouched, setDividendYieldTouched] = useState(false);

  const fetchSurface = async (nextParams: SurfaceParams, overrides: RateOverrides) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/iv-surface?${buildQuery(nextParams, overrides)}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Something went wrong.");
      }
      const surface = json as SurfaceResponse;
      setData(surface);
      // Sync back any field we didn't explicitly override to the backend's
      // freshly computed default (this is what makes dividend yield refresh
      // to the new ticker's actual value instead of showing a stale one).
      setParams((p) => ({
        ...p,
        riskFreeRate: overrides.riskFreeRate ? p.riskFreeRate : surface.riskFreeRate,
        dividendYield: overrides.dividendYield ? p.dividendYield : surface.dividendYield,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleParamsChange = (next: SurfaceParams) => {
    if (next.dividendYield !== params.dividendYield) setDividendYieldTouched(true);
    if (next.riskFreeRate !== params.riskFreeRate) setRiskFreeRateTouched(true);
    if (next.ticker !== params.ticker) setDividendYieldTouched(false);
    setParams(next);
  };

  useEffect(() => {
    fetchSurface(DEFAULT_PARAMS, { riskFreeRate: false, dividendYield: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2.5rem 1.5rem", position: "relative", zIndex: 1 }}>
      <a
        href="https://anthony-le.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Anthony Le's personal website"
        className="mono"
        style={{
          display: "inline-block",
          fontSize: "1.1rem",
          fontWeight: 700,
          letterSpacing: "-0.5px",
          textDecoration: "none",
          marginBottom: "0.75rem",
        }}
      >
        <span style={{ color: "var(--accent-cyan)" }}>AL</span>
        <span style={{ color: "var(--text-primary)" }}>_</span>
      </a>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>
        Implied Volatility Surface
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.3rem", marginBottom: "0.5rem" }}>
        Created by{" "}
        <a
          href="https://anthony-le.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--accent-cyan)" }}
        >
          <strong>Anthony Le</strong>
        </a>
      </p>
      <p style={{ color: "var(--text-secondary)", maxWidth: "760px", marginBottom: "1.75rem", lineHeight: 1.6 }}>
        This application calculates and visualizes the implied volatility surface for options
        using the Black-Scholes model. Choose a ticker symbol and set the risk-free rate,
        dividend yield, time to expiration, and strike price range — the surface shows how
        implied volatility varies with time to expiration and strike price (or moneyness).
      </p>

      {data && (
        <StatTiles
          ticker={data.ticker}
          spotPrice={data.spotPrice}
          dividendYield={data.dividendYield}
          riskFreeRate={data.riskFreeRate}
        />
      )}

      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "0.85rem 1rem",
          fontSize: "0.82rem",
          color: "var(--text-secondary)",
          marginBottom: "1.75rem",
        }}
      >
        Note: by default, the risk-free rate is the current 13-week Treasury bill (^IRX) yield,
        and the dividend yield is the underlying asset&apos;s latest yield — both fetched from
        Yahoo Finance.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "1.5rem", alignItems: "start" }}>
        <ControlsPanel
          params={params}
          onChange={handleParamsChange}
          onSubmit={() =>
            fetchSurface(params, { riskFreeRate: riskFreeRateTouched, dividendYield: dividendYieldTouched })
          }
          loading={loading}
        />

        <div
          style={{
            position: "relative",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "1rem",
            minHeight: "640px",
          }}
        >
          {error && (
            <div style={{ color: "var(--accent-red)", padding: "1rem" }}>
              {error}
            </div>
          )}
          {data && data.warnings.length > 0 && (
            <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginBottom: "0.5rem" }}>
              {data.warnings.join(" · ")}
            </div>
          )}
          {data && !error && (
            <SurfacePlot ticker={data.ticker} grid={data.grid} yAxisLabel={data.yAxisLabel} />
          )}
          {loading && <LoadingSpinner overlay={Boolean(data) && !error} />}
        </div>
      </div>

    </div>
    <Footer />
    </>
  );
}
