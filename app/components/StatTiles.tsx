interface StatTilesProps {
  ticker: string;
  spotPrice: number;
  dividendYield: number;
  riskFreeRate: number;
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: "1 1 160px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "1rem 1.25rem",
      }}
    >
      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
        {label}
      </div>
      <div className="mono" style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
        {value}
      </div>
    </div>
  );
}

export default function StatTiles({ ticker, spotPrice, dividendYield, riskFreeRate }: StatTilesProps) {
  return (
    <div style={{ display: "flex", gap: "0.85rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
      <Tile label="Ticker" value={ticker} />
      <Tile label="Spot Price" value={`$${spotPrice.toFixed(2)}`} />
      <Tile label="Dividend Yield" value={`${(dividendYield * 100).toFixed(2)}%`} />
      <Tile label="Risk-Free Rate" value={`${(riskFreeRate * 100).toFixed(2)}%`} />
    </div>
  );
}
