import type { SurfaceParams } from "@/lib/types";

interface ControlsPanelProps {
  params: SurfaceParams;
  onChange: (params: SurfaceParams) => void;
  onSubmit: () => void;
  loading: boolean;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function RangeField({
  label,
  min,
  max,
  step,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  minValue: number;
  maxValue: number;
  onMinChange: (v: number) => void;
  onMaxChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label>{label}</label>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={minValue}
          onChange={(e) => onMinChange(Number(e.target.value))}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={maxValue}
          onChange={(e) => onMaxChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}

export default function ControlsPanel({ params, onChange, onSubmit, loading }: ControlsPanelProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "1.25rem",
      }}
    >
      <h2 style={{ fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
        Model Parameters
      </h2>

      <Field label="Ticker Symbol">
        <input
          type="text"
          maxLength={6}
          value={params.ticker}
          onChange={(e) => onChange({ ...params, ticker: e.target.value.toUpperCase() })}
        />
      </Field>

      <Field label="Risk-Free Rate (e.g., 0.0425 for 4.25%)">
        <input
          type="number"
          step={0.0001}
          value={params.riskFreeRate}
          onChange={(e) => onChange({ ...params, riskFreeRate: Number(e.target.value) })}
        />
      </Field>

      <Field label="Dividend Yield (e.g., 0.0615 for 6.15%)">
        <input
          type="number"
          step={0.0001}
          value={params.dividendYield}
          onChange={(e) => onChange({ ...params, dividendYield: Number(e.target.value) })}
        />
      </Field>

      <RangeField
        label="Time to Expiration (Years) — min / max"
        min={0}
        max={3}
        step={0.01}
        minValue={params.timeMin}
        maxValue={params.timeMax}
        onMinChange={(v) => onChange({ ...params, timeMin: v })}
        onMaxChange={(v) => onChange({ ...params, timeMax: v })}
      />

      <RangeField
        label="Strike Price Range (% of Spot) — min / max"
        min={50}
        max={200}
        step={1}
        minValue={params.minStrikePct}
        maxValue={params.maxStrikePct}
        onMinChange={(v) => onChange({ ...params, minStrikePct: v })}
        onMaxChange={(v) => onChange({ ...params, maxStrikePct: v })}
      />

      <Field label="Y-Axis">
        <select
          value={params.yAxis}
          onChange={(e) => onChange({ ...params, yAxis: e.target.value as SurfaceParams["yAxis"] })}
        >
          <option value="strike">Strike Price ($)</option>
          <option value="moneyness">Moneyness</option>
        </select>
      </Field>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "0.65rem",
          borderRadius: "6px",
          border: "none",
          background: loading ? "var(--text-muted)" : "var(--accent-cyan)",
          color: "var(--bg-primary)",
          fontWeight: 700,
          fontSize: "0.9rem",
          cursor: loading ? "default" : "pointer",
        }}
      >
        {loading ? "Loading…" : "Update Surface"}
      </button>
    </form>
  );
}
