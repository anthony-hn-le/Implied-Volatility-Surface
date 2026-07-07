##==============================================================================
## Implied Volatility Surface — API
## Vercel Python serverless function backing the Next.js frontend.
##
## This is the same Black-Scholes / implied-volatility / yfinance pipeline that
## used to live in volatility_surface.py as a Streamlit app, ported to return
## JSON instead of rendering a Streamlit page. The numerical logic (bs_call_price,
## implied_volatility, the options-data pipeline, the surface interpolation) is
## unchanged; only the Streamlit-specific I/O (st.error/st.stop/st.warning/
## st.spinner) is replaced with plain Python control flow.
##==============================================================================

import json
from datetime import timedelta
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

import numpy as np
import pandas as pd
import yfinance as yf
from scipy.stats import norm
from scipy.optimize import brentq
from scipy.interpolate import griddata


class ApiError(Exception):
    """Raised for expected, user-facing failures (bad ticker, no data, etc.)."""

    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status


##===============================================================================
## Black-Scholes pricing and implied volatility (unchanged from volatility_surface.py)
##===============================================================================
def bs_call_price(S, K, T, r, sigma, q=0):
    if T <= 0 or S <= 0 or K <= 0 or sigma <= 0:
        return np.nan
    d1 = (np.log(S / K) + (r - q + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    call_price = (S * np.exp(-q * T) * norm.cdf(d1) -
                  K * np.exp(-r * T) * norm.cdf(d2))
    return call_price


def implied_volatility(price, S, K, T, r, q=0):
    if T <= 0 or price <= 0:
        return np.nan

    def objective_function(sigma):
        return bs_call_price(S, K, T, r, sigma, q) - price

    try:
        implied_vol = brentq(objective_function, 1e-6, 5)
    except (ValueError, RuntimeError):
        implied_vol = np.nan

    return implied_vol


##===============================================================================
## Data retrieval (Streamlit error UI replaced with ApiError)
##===============================================================================
def get_dividend_yield(ticker_symbol):
    ticker = yf.Ticker(ticker_symbol)
    try:
        dividend_yield = ticker.info['dividendYield']
        if dividend_yield is not None:
            return dividend_yield / 100  # Convert to decimal
        return 0.0
    except Exception:
        return 0.0


def get_risk_free_rate():
    try:
        return yf.Ticker("^IRX").info['regularMarketPrice'] / 100
    except Exception:
        return 0.0425  # fallback if ^IRX is unavailable


def get_spot_price(ticker_symbol):
    ticker = yf.Ticker(ticker_symbol)
    try:
        spot_price = ticker.info['regularMarketPrice']
    except Exception as e:
        raise ApiError(f'An error occurred while fetching spot price data: {e}')

    if spot_price is None or pd.isna(spot_price):
        raise ApiError(f'Failed to retrieve spot price data for {ticker_symbol}.')
    return spot_price


def get_valid_expiration_dates(ticker, time_min, time_max):
    today = pd.Timestamp('today').normalize()

    try:
        expirations = ticker.options
    except Exception as e:
        raise ApiError(f'Error fetching options for {ticker.ticker}: {e}')

    if not expirations:
        raise ApiError(f'No available option expiration dates for {ticker.ticker}.')

    valid_dates = [
        pd.Timestamp(date) for date in expirations
        if (pd.Timestamp(date) >= today + timedelta(days=365 * time_min)) and
           (pd.Timestamp(date) <= today + timedelta(days=365 * time_max))
    ]

    if not valid_dates:
        raise ApiError('No expiration dates fall within the requested time-to-expiration range.')

    return valid_dates


def fetch_option_data(ticker, exp_dates):
    option_data = []
    warnings = []

    for exp_date in exp_dates:
        try:
            opt_chain = ticker.option_chain(exp_date.strftime('%Y-%m-%d'))
            calls = opt_chain.calls
        except Exception as e:
            warnings.append(f'Failed to fetch option chain for {exp_date.date()}: {e}')
            continue

        calls = calls[(calls['bid'] > 0) & (calls['ask'] > 0)]

        for _, row in calls.iterrows():
            option_data.append({
                'expirationDate': exp_date,
                'strike': row['strike'],
                'mid': (row['bid'] + row['ask']) / 2,
            })

    return pd.DataFrame(option_data), warnings


def process_options_data(option_df, spot_price, min_strike_pct, max_strike_pct):
    option_df = option_df[
        (option_df['strike'] >= spot_price * (min_strike_pct / 100)) &
        (option_df['strike'] <= spot_price * (max_strike_pct / 100))
    ].copy()

    today = pd.Timestamp('today').normalize()
    option_df['daysToExpiration'] = (option_df['expirationDate'] - today).dt.days
    option_df['timeToExpiration'] = option_df['daysToExpiration'] / 365
    option_df.reset_index(drop=True, inplace=True)

    return option_df


def finalize_options_data(options_df, spot_price, risk_free_rate, dividend_yield):
    options_df['impliedVolatility'] = options_df.apply(
        lambda row: implied_volatility(
            price=row['mid'],
            S=spot_price,
            K=row['strike'],
            T=row['timeToExpiration'],
            r=risk_free_rate,
            q=dividend_yield
        ), axis=1
    )

    options_df.dropna(subset=['impliedVolatility'], inplace=True)
    options_df['impliedVolatility'] *= 100  # Convert to percentage
    options_df.sort_values('strike', inplace=True)
    options_df['moneyness'] = options_df['strike'] / spot_price

    return options_df


##===============================================================================
## End-to-end pipeline: fetch -> process -> interpolate onto a plotting grid
##===============================================================================
def build_surface(params):
    ticker_symbol = params['ticker']
    ticker = yf.Ticker(ticker_symbol)

    spot_price = get_spot_price(ticker_symbol)
    risk_free_rate = params['riskFreeRate'] if params['riskFreeRate'] is not None else get_risk_free_rate()
    dividend_yield = params['dividendYield'] if params['dividendYield'] is not None else get_dividend_yield(ticker_symbol)

    exp_dates = get_valid_expiration_dates(ticker, params['timeMin'], params['timeMax'])
    option_data, warnings = fetch_option_data(ticker, exp_dates)

    options_df = process_options_data(option_data, spot_price, params['minStrikePct'], params['maxStrikePct'])
    if options_df.empty:
        raise ApiError('No option data available at this time due to market hours. Please try again later.')

    options_df = finalize_options_data(options_df, spot_price, risk_free_rate, dividend_yield)
    if options_df.empty:
        raise ApiError('Implied volatility could not be computed for any contract in this range.')

    if params['yAxis'] == 'moneyness':
        Y = options_df['moneyness'].values
        y_label = 'Moneyness (Strike / Spot)'
    else:
        Y = options_df['strike'].values
        y_label = 'Strike Price ($)'

    X = options_df['timeToExpiration'].values
    Z = options_df['impliedVolatility'].values

    ti = np.linspace(X.min(), X.max(), 50)
    ki = np.linspace(Y.min(), Y.max(), 50)
    T, K = np.meshgrid(ti, ki)

    Zi = griddata((X, Y), Z, (T, K), method='linear')

    # Replace NaN (outside the convex hull of observed points) with None so the
    # response is valid JSON; the frontend treats these as gaps in the surface.
    z_list = [[None if np.isnan(v) else round(float(v), 4) for v in row] for row in Zi]

    return {
        'ticker': ticker_symbol,
        'spotPrice': round(float(spot_price), 4),
        'dividendYield': round(float(dividend_yield), 6),
        'riskFreeRate': round(float(risk_free_rate), 6),
        'yAxisLabel': y_label,
        'grid': {
            't': [round(float(v), 6) for v in ti],
            'k': [round(float(v), 4) for v in ki],
            'z': z_list,
        },
        'warnings': warnings,
    }


##===============================================================================
## Request parsing and handler
##===============================================================================
def parse_params(query):
    def get_float(name, default=None):
        value = query.get(name, [None])[0]
        if value is None or value == '':
            return default
        try:
            return float(value)
        except ValueError:
            raise ApiError(f'Invalid value for {name}: {value}')

    ticker = query.get('ticker', [''])[0].strip().upper()
    if not ticker:
        raise ApiError('Missing required parameter: ticker')

    return {
        'ticker': ticker,
        'riskFreeRate': get_float('riskFreeRate'),
        'dividendYield': get_float('dividendYield'),
        'timeMin': get_float('timeMin', 0.01),
        'timeMax': get_float('timeMax', 1.0),
        'minStrikePct': get_float('minStrikePct', 80),
        'maxStrikePct': get_float('maxStrikePct', 120),
        'yAxis': query.get('yAxis', ['strike'])[0],
    }


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = parse_qs(urlparse(self.path).query)

        try:
            params = parse_params(query)
            result = build_surface(params)
            self._send_json(200, result)
        except ApiError as e:
            self._send_json(e.status, {'error': e.message})
        except Exception as e:  # noqa: BLE001 - surface unexpected errors as JSON, not a stack trace page
            self._send_json(500, {'error': f'Unexpected server error: {e}'})

    def _send_json(self, status, payload):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
