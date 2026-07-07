"use client";

import dynamic from "next/dynamic";
import type { SurfaceGrid } from "@/lib/types";
import { SURFACE_COLORSCALE, SCENE_BG, GRID_COLOR, AXIS_COLOR } from "@/lib/theme";

// plotly.js touches `window` at import time, so it can't be server-rendered.
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface SurfacePlotProps {
  ticker: string;
  grid: SurfaceGrid;
  yAxisLabel: string;
}

export default function SurfacePlot({ ticker, grid, yAxisLabel }: SurfacePlotProps) {
  const axisStyle = {
    gridcolor: GRID_COLOR,
    zerolinecolor: GRID_COLOR,
    color: AXIS_COLOR,
    backgroundcolor: SCENE_BG,
  };

  return (
    <Plot
      data={[
        {
          type: "surface",
          x: grid.t,
          y: grid.k,
          z: grid.z,
          colorscale: SURFACE_COLORSCALE,
          colorbar: {
            title: { text: "IV (%)", font: { color: "#94a3b8" } },
            tickfont: { color: "#94a3b8" },
            outlinewidth: 0,
          },
        },
      ]}
      layout={{
        title: {
          text: `Implied Volatility Surface — ${ticker}`,
          font: { color: "#f1f5f9", size: 16 },
        },
        autosize: true,
        height: 640,
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        margin: { l: 0, r: 0, b: 0, t: 50 },
        scene: {
          xaxis: { title: { text: "Time to Expiration (years)" }, ...axisStyle },
          yaxis: { title: { text: yAxisLabel }, ...axisStyle },
          zaxis: { title: { text: "Implied Volatility (%)" }, ...axisStyle },
          bgcolor: SCENE_BG,
        },
      }}
      config={{ displaylogo: false, responsive: true }}
      style={{ width: "100%" }}
      useResizeHandler
    />
  );
}
