# Implied Volatility Surface Viewer

A web app that visualizes the **implied volatility surface** for equity options using real-time data from Yahoo Finance. Implied volatilities are computed with the Black-Scholes model and presented on an interactive 3D surface.

## 🌐 Live Demo

[implied-volatility-surface-anthony.streamlit.app](https://implied-volatility-surface-anthony.streamlit.app/) *(being migrated to Vercel — this link will be updated once the new deployment is live)*

## ✨ Features

- **Real-Time Financial Data**: Pulls live options, risk-free rate, and dividend yield data via Yahoo Finance.
- **Interactive 3D Surface**: Visualizes implied volatility against strike price (or moneyness) and time to expiration.
- **Customizable Parameters**:
  - Risk-free rate & dividend yield
  - Ticker symbol (default: SPY)
  - Time-to-expiration and strike-price ranges
  - Y-axis choice: Strike or Moneyness

## 🏗️ Architecture

The Black-Scholes pricer, Brent's-method implied-volatility solver, and Yahoo Finance data pipeline are unchanged from the original version — only the delivery mechanism changed, from a Streamlit app to a Vercel-hosted Next.js frontend backed by a Vercel Python serverless function:

```
api/iv-surface.py   # Python serverless function: same Black-Scholes/IV/yfinance
                     # pipeline as before, now returning JSON (server-side grid
                     # interpolation via scipy.interpolate.griddata)
app/                 # Next.js App Router frontend
  page.tsx            # Controls + stat tiles + surface plot, calls /api/iv-surface
  components/
    ControlsPanel.tsx  # Ticker, rate/yield, expiration & strike range, y-axis
    StatTiles.tsx       # Ticker / Spot Price / Dividend Yield / Risk-Free Rate
    SurfacePlot.tsx      # react-plotly.js Surface trace, dark theme + custom colorscale
```

This move away from Streamlit Community Cloud was motivated by its "sleep after inactivity" behavior — a cold Streamlit app takes 30-60+ seconds to wake up, which is a bad experience for a link in a portfolio. Vercel's Python functions cold-start in low single digit seconds instead.

## 🛠️ Tech Stack

- **Next.js / React / TypeScript** — frontend
- **Vercel Python Functions** — serverless backend (`api/iv-surface.py`)
- **yfinance** — financial data
- **NumPy / Pandas / SciPy** — data handling and the implied-volatility solver
- **Plotly (react-plotly.js)** — 3D surface visualization

## 💻 Local Development

Requires Node.js, Python 3.12+, and the [Vercel CLI](https://vercel.com/docs/cli).

```bash
npm install
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

vercel dev   # runs the Next.js frontend and the Python function together
```

Plain `next dev` will serve the frontend but not the Python function under `/api` — use `vercel dev` to test the full app locally.

## 📝 License

[MIT License](https://opensource.org/licenses/MIT) — Free to use, modify, and distribute.

---

Developed by [Anthony Le](https://www.linkedin.com/in/anthony-hn-le/)
